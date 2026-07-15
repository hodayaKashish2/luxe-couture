import crypto from 'crypto';

import { normalizePhone } from '@/lib/phone-match';

export { normalizePhone, phonesMatch } from '@/lib/phone-match';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.OWNER_SECRET || '';
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
