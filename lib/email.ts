import { Resend } from 'resend';
import nodemailer from 'nodemailer';

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

function getSmtpCredentials() {
  const user = (
    process.env.SMTP_USER ||
    process.env.SMTP_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ''
  ).trim();

  const pass = (
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASSWORD ||
    ''
  ).trim();

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
  return (process.env.ADMIN_EMAIL || 'hodayaka1212@gmail.com').trim().toLowerCase();
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

  return process.env.RESEND_FROM || 'DressRental <onboarding@resend.dev>';
}

function isPlaceholderFrom(from: string) {
  const lower = from.toLowerCase();
  return (
    lower.includes('@resend.dev') ||
    lower.includes('yourdomain.com') ||
    lower.includes('your_') ||
    lower.includes('example.com')
  );
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
  smtp: {
    hasUser: boolean;
    hasPassword: boolean;
    userFrom: 'SMTP_USER' | 'ADMIN_EMAIL' | 'missing';
    passwordFrom: 'SMTP_PASSWORD' | 'GMAIL_APP_PASSWORD' | 'SMTP_PASS' | 'missing';
    fix: string;
  };
};

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
    fix = 'חסר SMTP_USER ב-Vercel. הוסיפי: SMTP_USER = hodayaka1212@gmail.com';
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
        'חסרה הגדרת מיילים. הוסיפי ב-Vercel: SMTP_PASSWORD (סיסמת אפליקציה של Gmail) ו-SMTP_USER=hodayaka1212@gmail.com',
    };
  }

  // Gmail SMTP — שולח לכל כתובת
  if (smtp) {
    const result = await sendViaSmtp(recipient, subject, html);
    if (result?.success) return result;
    if (result && !resend) return result;
  }

  // Resend — רק עם דומיין מאומת (לא onboarding@resend.dev)
  if (resend) {
    const from = getFromAddress();
    if (isPlaceholderFrom(from) && recipient !== getAdminEmail()) {
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

export async function sendBookingPendingEmail(params: {
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
  paymentUrl?: string | null;
}) {
  const paySection = params.paymentUrl
    ? `<p style="margin-top:24px;">
          <a href="${params.paymentUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
            לתשלום עכשיו →
          </a>
        </p>`
    : `<p style="line-height:1.7;color:#554a33;margin-top:16px;">ניצור איתך קשר להשלמת התשלום.</p>`;

  return sendEmailTo(
    params.to,
    `📅 שריון התקבל: ${params.dressName}`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">שלום ${params.customerName}!</h2>
        <p style="line-height:1.7;color:#554a33;">השריון שלך נקלט בהצלחה וממתין לתשלום.</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${params.dressName}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${params.eventDate}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום לתשלום:</strong> ₪${params.amount}</p>
        ${paySection}
        <p style="margin-top:16px;">
          <a href="${getAppUrl()}/account" style="color:#b8860b;font-weight:bold;">לאזור האישי →</a>
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
        <p style="line-height:1.7;color:#554a33;">התשלום שלך אושר והשריון מאושר!</p>
        <p style="line-height:1.7;color:#554a33;"><strong>שמלה:</strong> ${params.dressName}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>תאריך אירוע:</strong> ${params.eventDate}</p>
        <p style="line-height:1.7;color:#554a33;"><strong>סכום ששולם:</strong> ₪${params.amount}</p>
        <p style="line-height:1.7;color:#554a33;margin-top:16px;">ניצור קשר בהקדם לתיאום איסוף עם המשכירה.</p>
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
