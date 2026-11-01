import crypto from 'crypto';

const RESET_TTL_MS = 20 * 60 * 1000;

type ResetPayload = {
  purpose: 'password-reset';
  userId: string;
  pw: string;
  exp: number;
};

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.SITE_AUTH_SECRET || '';
}

export function createPasswordResetToken(userId: string, passwordHash: string) {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SECRET לא מוגדר');

  const payload = JSON.stringify({
    purpose: 'password-reset',
    userId,
    pw: passwordHash.slice(0, 24),
    exp: Date.now() + RESET_TTL_MS,
  } satisfies ResetPayload);
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function readPasswordResetToken(token: string): ResetPayload | null {
  const secret = getSecret();
  if (!secret || !token.includes('.')) return null;

  try {
    const [payloadB64, sig] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const data = JSON.parse(payload) as ResetPayload;
    if (data.purpose !== 'password-reset' || !data.userId || !data.pw || data.exp < Date.now()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function passwordResetEmailHtml(resetUrl: string) {
  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
      <h2 style="color:#3d2f24;margin-top:0;">איפוס סיסמה</h2>
      <p style="line-height:1.7;color:#554a33;">קיבלנו בקשה לאפס את הסיסמה בחשבון שלך באתר שמלה בקליק.</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
          בחירת סיסמה חדשה
        </a>
      </p>
      <p style="line-height:1.7;color:#554a33;font-size:13px;">הקישור תקף ל-20 דקות, ורק לחשבון הזה. אם לא ביקשת איפוס, אפשר להתעלם מהמייל.</p>
    </div>
  `;
}
