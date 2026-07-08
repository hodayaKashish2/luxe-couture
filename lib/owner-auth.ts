import crypto from 'crypto';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.OWNER_SECRET || '';
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  if (digits.length === 9) return `972${digits}`;
  return digits;
}

export function phonesMatch(a: string, b: string) {
  if (!a || !b) return false;
  return normalizePhone(a) === normalizePhone(b);
}

export function createOwnerToken(phone: string, ownerName: string) {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SECRET לא מוגדר');

  const payload = JSON.stringify({
    phone: normalizePhone(phone),
    ownerName,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyOwnerToken(token: string) {
  const secret = getSecret();
  if (!secret || !token.includes('.')) return null;

  const [payloadB64, sig] = token.split('.');
  const payload = Buffer.from(payloadB64, 'base64url').toString();
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (sig !== expected) return null;

  const data = JSON.parse(payload) as { phone: string; ownerName: string; exp: number };
  if (data.exp < Date.now()) return null;
  return data;
}

export function getOwnerFromRequest(request: Request) {
  const token = request.headers.get('x-owner-token');
  if (!token) return null;
  return verifyOwnerToken(token);
}
