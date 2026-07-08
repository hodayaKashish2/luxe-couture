import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey || apiKey.includes('הדביקי') || apiKey.includes('your_') || !apiKey.startsWith('re_')) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || 'hodayaka1212@gmail.com').trim().toLowerCase();
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** מייל למנהלת האתר */
export async function sendAdminEmail(subject: string, html: string) {
  return sendEmailTo(getAdminEmail(), subject, html);
}

/** שליחת מייל לכל כתובת תקינה */
export async function sendEmailTo(to: string, subject: string, html: string) {
  const resend = getResendClient();
  const recipient = to.trim();

  if (!isValidEmail(recipient)) {
    return { success: false as const, error: 'כתובת אימייל לא תקינה' };
  }

  if (!resend) {
    console.warn('RESEND_API_KEY לא מוגדר — המייל לא נשלח');
    return {
      success: false as const,
      error: 'חסר מפתח Resend תקין ב-.env.local (RESEND_API_KEY=re_...)',
    };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'DressRental <onboarding@resend.dev>',
    to: recipient,
    subject,
    html,
  });

  if (error) {
    console.error('שגיאה בשליחת מייל:', error);
    return { success: false as const, error: error.message };
  }

  return { success: true as const, sentTo: recipient };
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
}) {
  return sendEmailTo(
    params.to,
    `✨ אישור שריון: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.customerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">השריון שלך נקלט בהצלחה.</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${params.dressName}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${params.eventDate}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום:</strong> ₪${params.amount}</p>
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">ניצור קשר בהקדם לתיאום עם המשכירה.</p>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/account" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

/** @deprecated השתמשי ב-sendAdminEmail או sendEmailTo */
export async function sendEmail(subject: string, html: string) {
  return sendAdminEmail(subject, html);
}
