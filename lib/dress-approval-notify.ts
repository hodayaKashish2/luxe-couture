import type { SupabaseClient } from '@supabase/supabase-js';
import { parseContactEmailFromDescription } from '@/lib/dress-contact';
import { getAdminEmail, sendAdminEmail, sendDressApprovedOwnerEmail } from '@/lib/email';
import { phonesMatch } from '@/lib/owner-auth';
import { dressApprovedWhatsAppMessage, sendWhatsAppText, type WhatsAppSendResult } from '@/lib/whatsapp-notify';

export type DressForNotify = {
  id?: string | number;
  name: string;
  description?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  submitter_user_id?: string | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function resolveOwnerContact(supabase: SupabaseClient, dress: DressForNotify) {
  let email = '';
  let phone = String(dress.owner_phone || '').trim();
  let name = dress.owner_name || 'משכירה';

  if (dress.submitter_user_id) {
    const { data: user } = await supabase
      .from('site_users')
      .select('email, phone, display_name')
      .eq('id', dress.submitter_user_id)
      .maybeSingle();

    if (user?.email && isValidEmail(user.email)) email = user.email.trim().toLowerCase();
    if (user?.phone) phone = String(user.phone).trim() || phone;
    if (user?.display_name) name = user.display_name;
  }

  const directEmail = String(dress.owner_email || '').trim().toLowerCase();
  if (!email && directEmail && isValidEmail(directEmail)) {
    email = directEmail;
  }

  if (!email && dress.description) {
    const parsed = parseContactEmailFromDescription(dress.description);
    if (parsed) email = parsed;
  }

  if (!email && phone) {
    const { data: users } = await supabase
      .from('site_users')
      .select('email, phone, display_name')
      .not('email', 'is', null)
      .neq('email', '');

    const match = (users ?? []).find((user) => phonesMatch(String(user.phone || ''), phone));
    if (match?.email && isValidEmail(match.email)) {
      email = match.email.trim().toLowerCase();
      if (match.display_name && !dress.owner_name) name = match.display_name;
    }
  }

  return { email, phone, name };
}

export async function fetchDressForNotify(supabase: SupabaseClient, id: string | number) {
  const full = await supabase
    .from('dresses')
    .select(
      'id, name, description, owner_name, owner_email, owner_phone, submitter_user_id, status'
    )
    .eq('id', id)
    .maybeSingle();

  if (!full.error && full.data) return full.data as DressForNotify & { status: string };

  const fallback = await supabase
    .from('dresses')
    .select('id, name, description, owner_name, owner_phone, status')
    .eq('id', id)
    .maybeSingle();

  if (fallback.error || !fallback.data) return null;

  return {
    ...fallback.data,
    owner_email: parseContactEmailFromDescription(fallback.data.description || ''),
    submitter_user_id: null,
  } as DressForNotify & { status: string };
}

export async function notifyDressApproved(supabase: SupabaseClient, dress: DressForNotify) {
  const { email: ownerEmail, phone: ownerPhone, name: ownerName } = await resolveOwnerContact(
    supabase,
    dress
  );

  const emailTargets = new Set<string>();
  if (ownerEmail) emailTargets.add(ownerEmail);

  const adminEmail = getAdminEmail().toLowerCase();
  emailTargets.add(adminEmail);

  let emailSentTo: string[] = [];
  let emailError = '';

  for (const to of emailTargets) {
    const sent = await sendDressApprovedOwnerEmail({
      to,
      ownerName,
      dressName: dress.name,
    });
    if (sent.success) {
      emailSentTo.push(to);
    } else if (!emailError) {
      emailError = sent.error || 'שגיאת מייל';
    }
  }

  let whatsappResult: WhatsAppSendResult = { success: false, error: 'אין טלפון' };
  if (ownerPhone) {
    whatsappResult = await sendWhatsAppText(
      ownerPhone,
      dressApprovedWhatsAppMessage(ownerName, dress.name)
    );
  }

  await sendAdminEmail(
    `✅ שמלה אושרה: ${dress.name}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">סיכום אישור שמלה</h2>
        <p><strong>שם:</strong> ${dress.name}</p>
        <p><strong>משכירה:</strong> ${ownerName}</p>
        <p><strong>טלפון:</strong> ${ownerPhone || '—'}</p>
        <p><strong>מייל משכירה:</strong> ${ownerEmail || 'לא נמצא'}</p>
        <p><strong>מיילים שנשלחו:</strong> ${emailSentTo.length ? emailSentTo.join(', ') : 'לא נשלח'}</p>
        <p><strong>WhatsApp:</strong> ${whatsappResult.success ? 'נשלח ✓' : whatsappResult.error || 'לא נשלח'}</p>
        ${
          whatsappResult.waLink
            ? `<p style="margin-top:16px;"><a href="${whatsappResult.waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">שלחי וואטסאפ למשכירה →</a></p>`
            : ''
        }
      </div>
    `
  );

  return {
    success: emailSentTo.length > 0 || whatsappResult.success,
    ownerEmail,
    ownerPhone,
    emailSentTo,
    emailError,
    whatsapp: whatsappResult,
  };
}
