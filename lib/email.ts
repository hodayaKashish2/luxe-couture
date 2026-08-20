import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { DEFAULT_ADMIN_EMAIL, getSiteAdminEmail, getServerAppUrl, accountReservationsUrl, accountRentalsUrl, completeBookingUrl } from '@/lib/site-config';
import { PAYMENT_DEADLINE_DAYS } from '@/lib/booking-payment-deadlines';
import { buildDressUpdateDiffHtml } from '@/lib/dress-update-diff-html';

let resendClient: Resend | null = null;
let smtpTransport: nodemailer.Transporter | null = null;

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

function normalizeSmtpPassword(value: string) {
  return value.replace(/\s+/g, '').trim();
}

function getSmtpAuthUser() {
  const raw = (
    process.env.SMTP_USER ||
    process.env.SMTP_EMAIL ||
    process.env.ADMIN_EMAIL ||
    DEFAULT_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();

  // סיסמת אפליקציה קשורה לחשבון Gmail הספציפי — לא ממפים legacy כאן.
  return raw || DEFAULT_ADMIN_EMAIL;
}

function getSmtpCredentials() {
  const user = getSmtpAuthUser();

  const pass = normalizeSmtpPassword(
    process.env.SMTP_PASSWORD ||
      process.env.SMTP_PASS ||
      process.env.GMAIL_APP_PASSWORD ||
      process.env.GMAIL_PASSWORD ||
      ''
  );

  return { user, pass };
}

function getSmtpTransport(): nodemailer.Transporter | null {
  const { user, pass } = getSmtpCredentials();

  if (!user || !pass || pass.includes('your_') || pass.includes('הדביקי') || pass.includes('xxxx')) {
    return null;
  }

  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }

  return smtpTransport;
}

export function getAdminEmail(): string {
  return getSiteAdminEmail();
}

export function getAppUrl(): string {
  return getServerAppUrl();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getFromAddress() {
  const { user: smtpUser } = getSmtpCredentials();
  const fromName = process.env.SMTP_FROM_NAME || process.env.RESEND_FROM_NAME || 'שמלה בקליק';

  if (getSmtpTransport() && smtpUser) {
    return `${fromName} <${smtpUser}>`;
  }

  const configured = process.env.RESEND_FROM?.trim();
  if (configured && !isInvalidResendFrom(configured)) {
    return configured;
  }

  return `${fromName} <onboarding@resend.dev>`;
}

function isInvalidResendFrom(from: string) {
  const lower = from.toLowerCase();
  return (
    lower.includes('yourdomain.com') ||
    lower.includes('your-domain.com') ||
    lower.includes('your_') ||
    lower.includes('example.com')
  );
}

function isResendSandboxFrom(from: string) {
  return from.toLowerCase().includes('@resend.dev');
}

function isPlaceholderFrom(from: string) {
  return isResendSandboxFrom(from) || isInvalidResendFrom(from);
}

function formatResendError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes('only send testing emails') ||
    lower.includes('verify a domain') ||
    lower.includes('403')
  ) {
    return (
      'Resend במצב בדיקה — לא ניתן לשלוח ללקוחות. ' +
      'הוסיפי SMTP_PASSWORD (סיסמת אפליקציה של Gmail) ב-Vercel, ' +
      'או אמתי דומיין ב-resend.com/domains ועדכני RESEND_FROM.'
    );
  }
  return message;
}

async function sendViaSmtp(to: string, subject: string, html: string) {
  const transport = getSmtpTransport();
  if (!transport) return null;

  const from = getFromAddress();
  try {
    await transport.sendMail({ from, to, subject, html });
    return { success: true as const, sentTo: to, provider: 'smtp' as const };
  } catch (error) {
    smtpTransport = null;
    const message = error instanceof Error ? error.message : 'שגיאת SMTP';
    console.error('SMTP error:', message);
    return { success: false as const, error: `שגיאת שליחת מייל (Gmail): ${message}`, provider: 'smtp' as const };
  }
}

async function sendViaResend(to: string, subject: string, html: string) {
  const resend = getResendClient();
  if (!resend) return null;

  const from = getFromAddress();
  const { error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    console.error('Resend error:', error);
    return {
      success: false as const,
      error: formatResendError(error.message),
      provider: 'resend' as const,
    };
  }

  return { success: true as const, sentTo: to, provider: 'resend' as const };
}

export type EmailConfigStatus = {
  smtpConfigured: boolean;
  resendConfigured: boolean;
  canSendToCustomers: boolean;
  fromAddress: string;
  hint: string;
  smtpAuthUser: string;
  smtp: {
    hasUser: boolean;
    hasPassword: boolean;
    userFrom: 'SMTP_USER' | 'ADMIN_EMAIL' | 'missing';
    passwordFrom: 'SMTP_PASSWORD' | 'GMAIL_APP_PASSWORD' | 'SMTP_PASS' | 'missing';
    fix: string;
  };
};

export async function verifySmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  const transport = getSmtpTransport();
  if (!transport) {
    return { ok: false, error: 'SMTP לא מוגדר (חסר SMTP_PASSWORD או SMTP_USER)' };
  }

  try {
    await transport.verify();
    return { ok: true };
  } catch (error) {
    smtpTransport = null;
    const message = error instanceof Error ? error.message : 'שגיאת SMTP';
    return { ok: false, error: message };
  }
}

function getSmtpEnvDiagnostics() {
  const smtpUser = Boolean(process.env.SMTP_USER?.trim());
  const adminEmail = Boolean(process.env.ADMIN_EMAIL?.trim());
  const smtpPassword = Boolean(process.env.SMTP_PASSWORD?.trim());
  const smtpPass = Boolean(process.env.SMTP_PASS?.trim());
  const gmailAppPassword = Boolean(process.env.GMAIL_APP_PASSWORD?.trim());
  const gmailPassword = Boolean(process.env.GMAIL_PASSWORD?.trim());

  const hasUser = smtpUser || adminEmail;
  const hasPassword = smtpPassword || smtpPass || gmailAppPassword || gmailPassword;

  let userFrom: EmailConfigStatus['smtp']['userFrom'] = 'missing';
  if (smtpUser) userFrom = 'SMTP_USER';
  else if (adminEmail) userFrom = 'ADMIN_EMAIL';

  let passwordFrom: EmailConfigStatus['smtp']['passwordFrom'] = 'missing';
  if (smtpPassword) passwordFrom = 'SMTP_PASSWORD';
  else if (gmailAppPassword) passwordFrom = 'GMAIL_APP_PASSWORD';
  else if (smtpPass) passwordFrom = 'SMTP_PASS';

  let fix = 'הכל מוגדר — אם עדיין false, עשי Redeploy ב-Vercel';
  if (!hasPassword) {
    fix =
      'חסר SMTP_PASSWORD ב-Vercel. הוסיפי: SMTP_PASSWORD = סיסמת אפליקציה של Gmail (16 תווים), סמני Production, ואז Redeploy';
  } else if (!hasUser) {
    fix = `חסר SMTP_USER ב-Vercel. הוסיפי: SMTP_USER = ${DEFAULT_ADMIN_EMAIL}`;
  }

  return { hasUser, hasPassword, userFrom, passwordFrom, fix };
}

export function getEmailConfigStatus(): EmailConfigStatus {
  const smtpDiag = getSmtpEnvDiagnostics();
  const smtpConfigured = Boolean(getSmtpTransport());
  const resendConfigured = Boolean(getResendClient());
  const fromAddress = getFromAddress();
  const resendSandbox = isPlaceholderFrom(fromAddress);

  let hint = 'לא מוגדר שליחת מיילים';
  if (smtpConfigured) {
    hint = 'Gmail SMTP מוגדר — ניתן לשלוח לכל לקוחה';
  } else if (resendConfigured && !resendSandbox) {
    hint = 'Resend עם דומיין מאומת — ניתן לשלוח לכל לקוחה';
  } else if (resendConfigured && resendSandbox) {
    hint =
      'Resend לא מוכן ללקוחות — הוסיפי SMTP_PASSWORD (סיסמת אפליקציה של Gmail) ב-Vercel ועשי Redeploy';
  }

  return {
    smtpConfigured,
    resendConfigured,
    canSendToCustomers: smtpConfigured || (resendConfigured && !resendSandbox),
    fromAddress,
    hint,
    smtpAuthUser: getSmtpAuthUser(),
    smtp: smtpDiag,
  };
}

/** מייל למנהלת האתר */
export async function sendAdminEmail(subject: string, html: string) {
  return sendEmailTo(getAdminEmail(), subject, html);
}

/** שליחת מייל לכל כתובת תקינה — SMTP (Gmail) קודם, אחר כך Resend */
export async function sendEmailTo(to: string, subject: string, html: string) {
  const recipient = to.trim().toLowerCase();

  if (!isValidEmail(recipient)) {
    return { success: false as const, error: 'כתובת אימייל לא תקינה' };
  }

  const smtp = getSmtpTransport();
  const resend = getResendClient();

  if (!smtp && !resend) {
    return {
      success: false as const,
      error:
        `חסרה הגדרת מיילים. הוסיפי ב-Vercel: SMTP_PASSWORD (סיסמת אפליקציה של Gmail) ו-SMTP_USER=${DEFAULT_ADMIN_EMAIL}`,
    };
  }

  // Gmail SMTP — שולח לכל כתובת
  if (smtp) {
    const result = await sendViaSmtp(recipient, subject, html);
    if (result?.success) return result;
    if (result && !resend) return result;
  }

  // Resend sandbox — רק עם דומיין מאומת (לא onboarding@resend.dev)
  if (resend) {
    const from = getFromAddress();
    if (isResendSandboxFrom(from) && recipient !== getAdminEmail()) {
      return {
        success: false as const,
        error:
          'Resend במצב בדיקה — שולח רק ל-' +
          getAdminEmail() +
          '. הוסיפי SMTP_PASSWORD (סיסמת אפליקציה של Gmail) ב-Vercel Environment Variables.',
      };
    }

    const result = await sendViaResend(recipient, subject, html);
    if (result) return result;
  }

  return { success: false as const, error: 'שליחת המייל נכשלה' };
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
    `✨ אישור הזמנה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.customerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">ההזמנה שלך נקלטה בהצלחה.</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${params.dressName}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${params.eventDate}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום:</strong> ₪${params.amount}</p>
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">ההזמנה נקלטה. לתיאום מסירת השמלה — צרי קשר ישירות עם המשכירה; פרטיה מופיעים ב<strong>«ההזמנות שלי»</strong> באזור האישי.</p>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/account" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingPendingEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
  payUrl?: string;
}) {
  const payLink = params.payUrl || accountReservationsUrl();
  return sendEmailTo(
    params.to,
    `💳 הגיע הזמן לשלם: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">המשכירה אישרה את בקשת השריון שלך 🎉</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${escapeHtml(params.dressName)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${escapeHtml(params.eventDate)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום לתשלום:</strong> ₪${params.amount}</p>
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">יש לך <strong>${PAYMENT_DEADLINE_DAYS} ימים</strong> להשלים את התשלום. אחרי מועד זה הבקשה תבוטל והתאריך ישוחרר.</p>
        <p style="line-height:1.7;color:#554a33;">השלימי את התשלום ב<strong>ביט</strong> או <strong>העברה בנקאית</strong> דרך האתר, ואז לחצי <strong>אישור תשלום</strong>.</p>
        <p style="margin-top:24px;">
          <a href="${payLink}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            להשלמת התשלום →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingRequestSubmittedEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
}) {
  return sendEmailTo(
    params.to,
    `📨 בקשת השריון נשלחה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">קיבלנו את בקשת השריון שלך והעברנו אותה למשכירה לאישור.</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${escapeHtml(params.dressName)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך מבוקש:</strong> ${escapeHtml(params.eventDate)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום משוער:</strong> ₪${params.amount}</p>
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">תקבלי מייל עם תשובה האם השריון אושר <strong>עד 72 שעות</strong> מרגע שליחת הבקשה (ברוב המקרים הרבה לפני כן). אם תאושר — תוכלי להמשיך ולהשלים את התשלום.</p>
        <p style="margin-top:24px;">
          <a href="${accountReservationsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            מעקב באזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingOwnerRequestEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  amount: number;
  accountUrl: string;
}) {
  return sendEmailTo(
    params.to,
    `⏳ בקשת שריון חדשה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">יש לך <strong>בקשת שריון חדשה</strong> שממתינה לתשובתך.</p>
        <div style="margin:16px 0;padding:14px 16px;background:#faf6eb;border-radius:12px;border:1px solid #eadaaf;">
          <p style="margin:0 0 8px;"><strong>שמלה:</strong> ${escapeHtml(params.dressName)}</p>
          <p style="margin:0 0 8px;"><strong>תאריך:</strong> ${escapeHtml(params.eventDate)}</p>
          <p style="margin:0 0 8px;"><strong>שוכרת:</strong> ${escapeHtml(params.customerName)}</p>
          <p style="margin:0 0 8px;"><strong>טלפון:</strong> <span dir="ltr">${escapeHtml(params.customerPhone)}</span></p>
          <p style="margin:0;"><strong>סכום:</strong> ₪${params.amount}</p>
        </div>
        <p style="line-height:1.7;color:#554a33;">יש לך <strong>עד 48 שעות</strong> מרגע קבלת הבקשה לאשר או לדחות אותה. נשמח שתגיבי בהקדם — כדי שהשוכרת תדע אם היא יכולה להמשיך בתהליך.</p>
        <p style="line-height:1.7;color:#554a33;font-size:13px;background:#faf6eb;padding:12px 14px;border-radius:10px;border:1px solid #eadaaf;margin-top:14px;">
          💡 <strong>שימי לב:</strong> הביטול האוטומטי מתבצע על ידי המערכת, ולכן עלול להתרחש עם סטייה של מספר שעות — לעיתים כבר לאחר <strong>כ-45 שעות</strong>. כדי שלא תפספסי, מומלץ לא לחכות לרגע האחרון.
        </p>
        <p style="margin-top:24px;">
          <a href="${params.accountUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאישור הבקשה באתר →
          </a>
        </p>
        <p style="font-size:12px;color:#9a7b4f;margin-top:16px;">אם לא תגיבי, הבקשה תבוטל אוטומטית והשוכרת תקבל על כך הודעה.</p>
      </div>
    `
  );
}

export async function sendBookingOwnerReminderEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  customerName: string;
  eventDate: string;
  accountUrl: string;
}) {
  return sendEmailTo(
    params.to,
    `🔔 תזכורת: בקשת שריון ממתינה — ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">לפני כ-<strong>24 שעות</strong> התקבלה בקשת שריון לשמלה <strong>${escapeHtml(params.dressName)}</strong>, ועדיין לא הגבת.</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שוכרת:</strong> ${escapeHtml(params.customerName)} · <strong>תאריך:</strong> ${escapeHtml(params.eventDate)}</p>
        <p style="line-height:1.7;color:#554a33;">נותר לך זמן מוגבל להגיב — <strong>עד 48 שעות</strong> מרגע הבקשה. שימי לב: המערכת עלולה לחסום את הבקשה עם סטייה של מספר שעות, לעיתים כבר לאחר <strong>כ-45 שעות</strong> — אל תמתיני לרגע האחרון.</p>
        <p style="margin-top:24px;">
          <a href="${params.accountUrl}" style="display:inline-block;background:#166534;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאשר או לדחות עכשיו →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingOwnerApprovedEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
  payUrl: string;
}) {
  return sendBookingPendingEmail({ ...params, payUrl: params.payUrl });
}

export async function sendBookingOwnerApprovedAdminEmail(params: {
  bookingId: number;
  dressName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventDate: string;
  amount: number;
}) {
  const adminPanelUrl = `${getAppUrl()}/admin`;
  const reservationsUrl = accountReservationsUrl();

  return sendAdminEmail(
    `✅ המשכירה אישרה — ממתין לתשלום: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">המשכירה אישרה בקשת שריון</h2>
        <p style="line-height:1.7;color:#554a33;">השוכרת קיבלה מייל עם קישור לתשלום. ההזמנה ממתינה לתשלום מהשוכרת.</p>
        <div style="margin:16px 0;padding:14px 16px;background:#faf6eb;border-radius:12px;border:1px solid #eadaaf;">
          <p style="margin:0 0 8px;"><strong>מס׳ הזמנה:</strong> ${params.bookingId}</p>
          <p style="margin:0 0 8px;"><strong>שמלה:</strong> ${escapeHtml(params.dressName)}</p>
          <p style="margin:0 0 8px;"><strong>תאריך אירוע:</strong> ${escapeHtml(params.eventDate)}</p>
          <p style="margin:0 0 8px;"><strong>שוכרת:</strong> ${escapeHtml(params.customerName)}</p>
          <p style="margin:0 0 8px;"><strong>טלפון:</strong> <span dir="ltr">${escapeHtml(params.customerPhone)}</span></p>
          <p style="margin:0 0 8px;"><strong>אימייל:</strong> ${escapeHtml(params.customerEmail)}</p>
          <p style="margin:0;"><strong>סכום:</strong> ₪${params.amount}</p>
        </div>
        <p style="margin-top:24px;">
          <a href="${adminPanelUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לפאנל הניהול →
          </a>
        </p>
        <p style="font-size:12px;color:#9a7b4f;margin-top:12px;">קישור מעקב: <a href="${reservationsUrl}">${reservationsUrl}</a></p>
      </div>
    `
  );
}

export async function sendBookingOwnerRejectedEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  reason: string;
}) {
  return sendEmailTo(
    params.to,
    `לא אושר: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">לצערנו, המשכירה לא אישרה את בקשת השריון לשמלה <strong>${escapeHtml(params.dressName)}</strong> לתאריך ${escapeHtml(params.eventDate)}.</p>
        <div style="margin:16px 0;padding:14px 16px;border-right:4px solid #d4af37;background:#fff8e8;border-radius:10px;">
          <p style="margin:0 0 6px;font-weight:bold;color:#8b6508;">פרטים:</p>
          <p style="margin:0;line-height:1.7;color:#554a33;">${escapeHtml(params.reason)}</p>
        </div>
        <p style="line-height:1.7;color:#554a33;">אפשר לחפש שמלה אחרת בקטלוג — מקווים שתמצאי את המראה המושלם 💛</p>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            חזרה לקטלוג →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingSlotTakenEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
}) {
  return sendEmailTo(
    params.to,
    `התאריך נתפס: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">לצערנו, השמלה <strong>${escapeHtml(params.dressName)}</strong> שוריינה על ידי שוכרת אחרת לתאריך <strong>${escapeHtml(params.eventDate)}</strong>.</p>
        <div style="margin:16px 0;padding:14px 16px;border-right:4px solid #d4af37;background:#fff8e8;border-radius:10px;">
          <p style="margin:0;line-height:1.7;color:#554a33;">הבקשה שלך בוטלה — התאריך כבר לא זמין. אפשר לחפש תאריך אחר או שמלה אחרת בקטלוג.</p>
        </div>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            חזרה לקטלוג →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingPaymentExpiredEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
}) {
  return sendEmailTo(
    params.to,
    `פג מועד התשלום: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">בקשת השריון לשמלה <strong>${escapeHtml(params.dressName)}</strong> לתאריך ${escapeHtml(params.eventDate)} <strong>בוטלה</strong> כי לא הושלם התשלום בזמן.</p>
        <div style="margin:16px 0;padding:14px 16px;border-right:4px solid #d4af37;background:#fff8e8;border-radius:10px;">
          <p style="margin:0;line-height:1.7;color:#554a33;">התאריך שוחרר לשוכרות אחרות. אם השמלה עדיין מעניינת אותך — אפשר לשלוח בקשה חדשה (לאחר תיאום ומדידה).</p>
        </div>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            חזרה לקטלוג →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingOwnerTimeoutEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
}) {
  return sendEmailTo(
    params.to,
    `הבקשה בוטלה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">בקשת השריון לשמלה <strong>${escapeHtml(params.dressName)}</strong> לתאריך ${escapeHtml(params.eventDate)} <strong>בוטלה</strong>.</p>
        <div style="margin:16px 0;padding:14px 16px;border-right:4px solid #c9a227;background:#fff8e8;border-radius:10px;">
          <p style="margin:0;line-height:1.7;color:#554a33;">המשכירה לא הגיבה לבקשה בתוך <strong>48 שעות</strong>, ולכן לא ניתן להמשיך בתהליך השריון.</p>
        </div>
        <p style="line-height:1.7;color:#554a33;">אפשר לנסות תאריך אחר או לבחור שמלה אחרת בקטלוג.</p>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            חזרה לקטלוג →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
}) {
  return sendEmailTo(
    params.to,
    `✅ אישור תשלום: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.customerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">התשלום שלך התקבל וההזמנה מאושרת!</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${params.dressName}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${params.eventDate}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום ששולם:</strong> ₪${params.amount}</p>
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">ההזמנה אושרה והתאריך שמור עבורך. לתיאום מסירת השמלה — צרי קשר ישירות עם המשכירה; פרטיה מופיעים ב<strong>«ההזמנות שלי»</strong> באזור האישי.</p>
        <p style="margin-top:24px;">
          <a href="${accountReservationsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            להזמנות שלי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendBookingConfirmedOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  amount: number;
}) {
  return sendEmailTo(
    params.to,
    `✅ שריון מאושר ושולם: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">התשלום עבור השמלה <strong>${escapeHtml(params.dressName)}</strong> אושר — השריון לתאריך <strong>${escapeHtml(params.eventDate)}</strong> סגור.</p>
        <div style="margin:16px 0;padding:14px 16px;background:#faf6eb;border-radius:12px;border:1px solid #eadaaf;">
          <p style="margin:0 0 8px;"><strong>שוכרת:</strong> ${escapeHtml(params.customerName)}</p>
          <p style="margin:0 0 8px;"><strong>טלפון:</strong> <span dir="ltr">${escapeHtml(params.customerPhone)}</span></p>
          <p style="margin:0;"><strong>סכום:</strong> ₪${params.amount}</p>
        </div>
        <p style="line-height:1.7;color:#554a33;">כדאי ליצור קשר עם השוכרת לתיאום מסירת השמלה. ניתן לראות את ההזמנה ב<strong>«השמלות שלי»</strong> באזור האישי.</p>
        <p style="margin-top:24px;">
          <a href="${accountRentalsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            ל«השמלות שלי» →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendPaymentReportedAdminEmail(params: {
  bookingId: number;
  dressName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventDate: string;
  amount: number;
  paymentMethodLabel: string;
  paymentSenderName?: string;
  paymentSenderPhone?: string;
}) {
  const approveUrl = `${getAppUrl()}/api/payments/approve?bookingId=${params.bookingId}&token=${encodeURIComponent(process.env.ADMIN_SECRET || '')}`;
  const adminPanelUrl = `${getAppUrl()}/admin`;

  const senderBlock =
    params.paymentSenderName || params.paymentSenderPhone
      ? `
        <div style="background:#fff8e8;border:2px solid #d4af37;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:#6e634c;font-weight:bold;">פרטי מבצעת ההעברה (לפי דיווח השוכרת):</p>
          ${params.paymentSenderName ? `<p style="margin:0 0 6px;line-height:1.7;color:#554a33;"><strong>שם:</strong> ${escapeHtml(params.paymentSenderName)}</p>` : ''}
          ${params.paymentSenderPhone ? `<p style="margin:0;line-height:1.7;color:#554a33;"><strong>טלפון:</strong> <span dir="ltr">${escapeHtml(params.paymentSenderPhone)}</span></p>` : ''}
        </div>
      `
      : '';

  return sendAdminEmail(
    `💰 דיווח תשלום — ${params.paymentMethodLabel}: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">לקוחה דיווחה על ביצוע תשלום</h2>
        <div style="background:#f4ebd4;border:2px solid #d4af37;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:0;font-size:13px;color:#6e634c;">אמצעי התשלום שבו שילמה:</p>
          <p style="margin:8px 0 0;font-size:20px;font-weight:bold;color:#3d2f24;">${params.paymentMethodLabel}</p>
        </div>
        ${senderBlock}
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${escapeHtml(params.dressName)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שוכרת:</strong> ${escapeHtml(params.customerName)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>טלפון בהזמנה:</strong> <span dir="ltr">${escapeHtml(params.customerPhone)}</span></p>
        <p style="line-height:1.7;color:#554a33;"><strong>אימייל:</strong> ${escapeHtml(params.customerEmail)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע לשריון:</strong> ${escapeHtml(params.eventDate)}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום:</strong> ₪${params.amount}</p>
        <p style="margin-top:24px;">
          <a href="${approveUrl}" style="display:inline-block;background:#166534;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">
            ✓ אישור תשלום ושריון לתאריך
          </a>
        </p>
        <p style="margin-top:12px;">
          <a href="${adminPanelUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לפאנל הניהול →
          </a>
        </p>
        <p style="font-size:12px;color:#9a7b4f;margin-top:12px;">לחיצה על «אישור תשלום» תאשר את התשלום ותשמור את השמלה לתאריך האירוע.</p>
      </div>
    `
  );
}

export async function sendPaymentReportedCustomerEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
  paymentMethodLabel: string;
}) {
  return sendEmailTo(
    params.to,
    `✅ דיווח התשלום התקבל: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.customerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">קיבלנו את דיווח התשלום שלך ב<strong>${params.paymentMethodLabel}</strong> — תודה!</p>
        <p style="line-height:1.7;color:#554a33;">בקרוב תישלח אלייך הודעת אישור סופית במייל עם פרטי ההזמנה.</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${params.dressName}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${params.eventDate}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום:</strong> ₪${params.amount}</p>
      </div>
    `
  );
}

export async function sendDressPendingAdminEmail(params: {
  dressId: string | number;
  name: string;
  price: number;
  size: string;
  city: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  images: string[];
}) {
  const approveUrl = `${getAppUrl()}/api/dresses/approve?id=${params.dressId}&token=${encodeURIComponent(process.env.ADMIN_SECRET || '')}`;
  const adminUrl = `${getAppUrl()}/admin`;
  const imagesHtml = params.images
    .slice(0, 4)
    .map(
      (url) =>
        `<img src="${url}" alt="" style="width:120px;height:160px;object-fit:contain;border-radius:8px;border:1px solid #eadaaf;margin:4px;" />`
    )
    .join('');

  return sendAdminEmail(
    `👗 שמלה חדשה לאישור: ${params.name}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שמלה חדשה ממתינה לאישור</h2>
        <p><strong>שם:</strong> ${params.name}</p>
        <p><strong>מחיר:</strong> ₪${params.price}</p>
        <p><strong>מידה:</strong> ${params.size}</p>
        <p><strong>עיר:</strong> ${params.city}</p>
        <p><strong>משכירה:</strong> ${params.ownerName} · ${params.ownerPhone}${params.ownerEmail ? ` · ${params.ownerEmail}` : ''}</p>
        ${imagesHtml ? `<div style="margin:16px 0;">${imagesHtml}</div>` : ''}
        <p style="margin-top:24px;">
          <a href="${approveUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;margin-left:8px;">
            ✅ אשר והוסף לאתר
          </a>
          <a href="${adminUrl}" style="display:inline-block;background:#fff;color:#8b6508;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;border:2px solid #decfa8;">
            דף ניהול
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressPendingOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
}) {
  if (!params.to?.trim()) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  return sendEmailTo(
    params.to,
    `👗 השמלה התקבלה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.ownerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">קיבלנו את השמלה <strong>${params.dressName}</strong> והיא ממתינה לאישור ההנהלה.</p>
        <p style="line-height:1.7;color:#554a33;">נעדכן אותך במייל ברגע שהשמלה תאושר ותופיע בקטלוג האתר.</p>
        <p style="margin-top:24px;">
          <a href="${accountRentalsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressApprovedOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
}) {
  if (!params.to?.trim()) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  return sendEmailTo(
    params.to,
    `✅ השמלה שלך אושרה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.ownerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">השמלה <strong>${params.dressName}</strong> אושרה ומופיעה עכשיו בקטלוג באתר שמלה בקליק.</p>
        <p style="margin-top:24px;">
          <a href="${getAppUrl()}/" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לצפייה בקטלוג →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressUpdatePendingAdminEmail(params: {
  dressId: string | number;
  dressName: string;
  ownerName: string;
  ownerEmail: string;
  diff: import('@/lib/dress-pending-update').DressUpdateDiff;
}) {
  const adminUrl = `${getAppUrl()}/admin`;
  const diffHtml = buildDressUpdateDiffHtml(params.diff);

  return sendAdminEmail(
    `✏️ עדכון שמלה לאישור: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">עדכון שמלה ממתין לאישור</h2>
        <p style="line-height:1.7;color:#554a33;">משכירה <strong>${escapeHtml(params.ownerName)}</strong> עדכנה את השמלה <strong>${escapeHtml(params.dressName)}</strong>.</p>
        <p style="line-height:1.7;color:#554a33;">להלן <strong>רק השינויים</strong> שביקשה (בקטלוג עדיין מופיעה הגרסה הנוכחית):</p>
        ${diffHtml}
        <p style="line-height:1.7;color:#554a33;margin-top:16px;"><strong>משכירה:</strong> ${escapeHtml(params.ownerName)}${params.ownerEmail ? ` · ${escapeHtml(params.ownerEmail)}` : ''}</p>
        <p style="margin-top:24px;">
          <a href="${adminUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאישור בדף הניהול →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressUpdatePendingOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  diff: import('@/lib/dress-pending-update').DressUpdateDiff;
}) {
  if (!params.to?.trim()) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  const diffHtml = buildDressUpdateDiffHtml(params.diff);

  return sendEmailTo(
    params.to,
    `✏️ העדכון התקבל: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">קיבלנו את העדכון לשמלה <strong>${escapeHtml(params.dressName)}</strong> והוא ממתין לאישור ההנהלה.</p>
        <p style="line-height:1.7;color:#554a33;">זה מה שביקשת לשנות:</p>
        ${diffHtml}
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">עד לאישור — בקטלוג תמשיך להופיע הגרסה הקודמת. נעדכן אותך במייל ברגע שהעדכון יאושר.</p>
        <p style="margin-top:24px;">
          <a href="${accountRentalsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendDressUpdateApprovedOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  dressId?: string | number;
  diff?: import('@/lib/dress-pending-update').DressUpdateDiff;
}) {
  if (!params.to?.trim()) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  const diffHtml = params.diff ? buildDressUpdateDiffHtml(params.diff) : '';
  const catalogUrl = params.dressId
    ? `${getAppUrl()}/?dress=${params.dressId}`
    : `${getAppUrl()}/`;

  return sendEmailTo(
    params.to,
    `✅ העדכון אושר — ${params.dressName} live בקטלוג`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:28px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}! 💛</h2>
        <p style="line-height:1.8;color:#554a33;font-size:15px;">
          חדשות טובות — העדכון ששלחת לשמלה <strong>${escapeHtml(params.dressName)}</strong>
          <strong> אושר על ידי ההנהלה</strong>.
        </p>
        <p style="line-height:1.8;color:#554a33;font-size:15px;">
          הגרסה המעודכנת <strong>מופיעה עכשיו בקטלוג</strong> באתר שמלה בקליק, ולקוחות רואות את הפרטים החדשים.
        </p>
        ${diffHtml ? `<p style="line-height:1.7;color:#554a33;margin-top:16px;font-weight:bold;">השינויים שאושרו:</p>${diffHtml}` : ''}
        <p style="line-height:1.7;color:#554a33;margin-top:20px;">תודה שאת איתנו — בהצלחה עם ההשכרות! ✨</p>
        <p style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px;">
          <a href="${catalogUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לצפייה בשמלה בקטלוג →
          </a>
          <a href="${accountRentalsUrl()}" style="display:inline-block;background:#fff;color:#8b6508;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;border:2px solid #decfa8;">
            לאזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressUpdateRejectedOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  reason?: string;
}) {
  if (!params.to?.trim()) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  const reasonBlock = params.reason?.trim()
    ? `<div style="margin:16px 0;padding:14px 16px;border-right:4px solid #d4af37;background:#fff8e8;border-radius:10px;">
        <p style="margin:0 0 6px;font-weight:bold;color:#8b6508;">סיבת הדחייה:</p>
        <p style="margin:0;line-height:1.7;color:#554a33;">${escapeHtml(params.reason.trim())}</p>
      </div>`
    : '';

  return sendEmailTo(
    params.to,
    `❌ העדכון לא אושר: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">העדכון ששלחת לשמלה <strong>${escapeHtml(params.dressName)}</strong> לא אושר על ידי ההנהלה.</p>
        ${reasonBlock}
        <p style="line-height:1.7;color:#554a33;">בקטלוג תמשיך להופיע הגרסה הקודמת. אפשר לערוך שוב ולשלוח מחדש מאזור האישי.</p>
        <p style="margin-top:24px;">
          <a href="${accountRentalsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לעריכה באזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressRejectedOwnerEmail(params: {
  to: string;
  ownerName: string;
  dressName: string;
  reason: string;
}) {
  return sendEmailTo(
    params.to,
    `❌ השמלה לא אושרה: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.ownerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">השמלה <strong>${escapeHtml(params.dressName)}</strong> ששלחת לאישור לא אושרה על ידי ההנהלה.</p>
        <div style="margin:16px 0;padding:14px 16px;border-right:4px solid #d4af37;background:#fff8e8;border-radius:10px;">
          <p style="margin:0 0 6px;font-weight:bold;color:#8b6508;">סיבת הדחייה:</p>
          <p style="margin:0;line-height:1.7;color:#554a33;">${escapeHtml(params.reason)}</p>
        </div>
        <p style="line-height:1.7;color:#554a33;">אפשר לערוך את הפרטים ולשלוח שוב מאזור האישי.</p>
        <p style="margin-top:24px;">
          <a href="${accountRentalsUrl()}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לאזור האישי →
          </a>
        </p>
      </div>
    `
  );
}

export async function sendDressRatingRejectedEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  reason: string;
}) {
  return sendEmailTo(
    params.to,
    `❌ הדירוג לא אושר: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${escapeHtml(params.customerName)}!</h2>
        <p style="line-height:1.7;color:#554a33;">הדירוג ששלחת על השמלה <strong>${escapeHtml(params.dressName)}</strong> לא אושר.</p>
        <div style="margin:16px 0;padding:14px 16px;border-right:4px solid #d4af37;background:#fff8e8;border-radius:10px;">
          <p style="margin:0 0 6px;font-weight:bold;color:#8b6508;">סיבת הדחייה:</p>
          <p style="margin:0;line-height:1.7;color:#554a33;">${escapeHtml(params.reason)}</p>
        </div>
        <p style="line-height:1.7;color:#554a33;">תודה על ההבנה 💛</p>
      </div>
    `
  );
}

/** @deprecated השתמשי ב-sendAdminEmail או sendEmailTo */
export async function sendEmail(subject: string, html: string) {
  return sendAdminEmail(subject, html);
}
