import type { SupabaseClient } from '@supabase/supabase-js';
import { phonesMatch } from '@/lib/owner-auth';
import { sendAdminEmail, sendDressApprovedOwnerEmail } from '@/lib/email';

type DressForNotify = {
  id?: string | number;
  name: string;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function resolveOwnerEmail(supabase: SupabaseClient, dress: DressForNotify) {
  const direct = String(dress.owner_email || '').trim().toLowerCase();
  if (direct && isValidEmail(direct)) {
    return direct;
  }

  const ownerPhone = String(dress.owner_phone || '').trim();
  if (!ownerPhone) return '';

  const { data: users } = await supabase
    .from('site_users')
    .select('email, phone')
    .not('email', 'is', null)
    .neq('email', '');

  const match = (users ?? []).find((user) => phonesMatch(String(user.phone || ''), ownerPhone));
  return String(match?.email || '').trim().toLowerCase();
}

export async function notifyDressApproved(supabase: SupabaseClient, dress: DressForNotify) {
  const ownerEmail = await resolveOwnerEmail(supabase, dress);
  const ownerName = dress.owner_name || 'משכירה';

  let ownerResult: { success: boolean; error?: string; sentTo?: string } = {
    success: false,
    error: 'לא נמצא מייל למשכירה',
  };

  if (ownerEmail) {
    const sent = await sendDressApprovedOwnerEmail({
      to: ownerEmail,
      ownerName,
      dressName: dress.name,
    });
    ownerResult = {
      success: sent.success,
      error: sent.success ? undefined : sent.error,
      sentTo: sent.success ? ownerEmail : undefined,
    };
  }

  await sendAdminEmail(
    ownerResult.success
      ? `✅ שמלה אושרה ונשלח מייל: ${dress.name}`
      : `✅ שמלה אושרה (מייל למשכירה לא נשלח): ${dress.name}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">השמלה אושרה בהצלחה</h2>
        <p><strong>שם:</strong> ${dress.name}</p>
        <p><strong>משכירה:</strong> ${ownerName}</p>
        <p><strong>טלפון:</strong> ${dress.owner_phone || '—'}</p>
        <p><strong>מייל למשכירה:</strong> ${ownerEmail || 'לא נמצא'}</p>
        <p><strong>מייל ללקוחה נשלח:</strong> ${ownerResult.success ? 'כן ✓' : `לא — ${ownerResult.error || ''}`}</p>
      </div>
    `
  );

  return ownerResult;
}
