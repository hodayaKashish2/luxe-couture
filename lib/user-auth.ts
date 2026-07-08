import crypto from 'crypto';
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const AUTH_COOKIE = 'site_token';

export type SiteUser = {
  userId: string;
  username: string;
  displayName: string;
  phone: string;
  email: string;
};

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.SITE_AUTH_SECRET || '';
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function createUserToken(user: SiteUser) {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SECRET לא מוגדר');

  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyUserToken(token: string): SiteUser | null {
  const secret = getSecret();
  if (!secret || !token.includes('.')) return null;

  try {
    const [payloadB64, sig] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) return null;

    const data = JSON.parse(payload) as SiteUser & { exp: number };
    if (data.exp < Date.now()) return null;

    return {
      userId: data.userId,
      username: data.username,
      displayName: data.displayName,
      phone: data.phone,
      email: data.email,
    };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request) {
  const header = request.headers.get('x-user-token');
  if (header) return header;

  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function getUserFromRequest(request: Request): SiteUser | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyUserToken(token);
}

export function authCookieOptions(maxAgeSec = 30 * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  };
}
