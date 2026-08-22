import type { SupabaseClient } from '@supabase/supabase-js';

import { dressRowToNotify, resolveOwnerContact } from '@/lib/dress-approval-notify';
import {
  sendAdminEmail,
  sendBookingCancelledByRenterEmail,
  sendBookingCancelledOwnerNoticeEmail,
} from '@/lib/email';
import type { SiteUser } from '@/lib/user-auth';

function formatEventDateHebrew(eventDate: string) {
  if (!eventDate) return eventDate;
  try {
    return new Date(`${eventDate}T00:00:00`).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return eventDate;
  }
}

export async function notifyBookingCancelledByRenter(
  supabase: SupabaseClient,
  params: {
    bookingId: number;
    dressId: number;
    customerName: string;
    customerEmail: string;
    eventDate: string;
    user: SiteUser;
  }
) {
  const warnings: string[] = [];
  const { data: dressRow } = await supabase
    .from('dresses')
    .select('id, name, owner_name, owner_email, owner_phone, description, submitter_user_id')
    .eq('id', params.dressId)
    .maybeSingle();

  const dressName = dressRow?.name || 'שמלה';
  const eventDate = formatEventDateHebrew(params.eventDate);
  const customerName = params.customerName || params.user.displayName || 'שוכרת';
  const renterEmail = (params.customerEmail || params.user.email || '').trim().toLowerCase();

  if (renterEmail) {
    const renterMail = await sendBookingCancelledByRenterEmail({
      to: renterEmail,
      customerName,
      dressName,
      eventDate,
    });
    if (!renterMail.success) {
      warnings.push(`renter: ${renterMail.error || 'שליחה נכשלה'}`);
      console.error('Cancel renter email failed:', renterMail.error);
      await sendAdminEmail(
        `⚠️ מייל ביטול לשוכרת לא נשלח: ${dressName}`,
        `
          <div dir="rtl" style="font-family:sans-serif;padding:16px;">
            <p>הזמנה #${params.bookingId} בוטלה, אך המייל לשוכרת <strong>${renterEmail}</strong> לא נשלח.</p>
            <p>סיבה: ${renterMail.error || 'לא ידוע'}</p>
          </div>
        `
      );
    }
  } else {
    warnings.push('renter: חסר אימייל');
    await sendAdminEmail(
      `⚠️ ביטול הזמנה #${params.bookingId} — אין אימייל לשוכרת`,
      `
        <div dir="rtl" style="font-family:sans-serif;padding:16px;">
          <p>הזמנה #${params.bookingId} (${dressName}) בוטלה, אך לא נמצא אימייל לשוכרת.</p>
          <p>שם: ${customerName} · משתמש: ${params.user.username}</p>
        </div>
      `
    );
  }

  if (dressRow) {
    const owner = await resolveOwnerContact(supabase, dressRowToNotify(dressRow));
    if (owner.email) {
      const ownerMail = await sendBookingCancelledOwnerNoticeEmail({
        to: owner.email,
        ownerName: owner.name,
        dressName,
        customerName,
        eventDate,
      });
      if (!ownerMail.success) {
        warnings.push(`owner: ${ownerMail.error || 'שליחה נכשלה'}`);
        console.error('Cancel owner email failed:', ownerMail.error);
        await sendAdminEmail(
          `⚠️ מייל ביטול למשכירה לא נשלח: ${dressName}`,
          `
            <div dir="rtl" style="font-family:sans-serif;padding:16px;">
              <p>הזמנה #${params.bookingId} בוטלה, אך המייל למשכירה <strong>${owner.email}</strong> לא נשלח.</p>
              <p>סיבה: ${ownerMail.error || 'לא ידוע'}</p>
            </div>
          `
        );
      }
    } else {
      warnings.push('owner: חסר אימייל');
      await sendAdminEmail(
        `⚠️ ביטול הזמנה #${params.bookingId} — אין אימייל למשכירה`,
        `
          <div dir="rtl" style="font-family:sans-serif;padding:16px;">
            <p>הזמנה #${params.bookingId} (${dressName}) בוטלה, אך לא נמצא אימייל למשכירה.</p>
          </div>
        `
      );
    }
  }

  return { warnings };
}
