import { NextResponse } from 'next/server';
import { isCatalogPdfEnabled } from '@/lib/catalog-pdf/create-catalog-pdf-response';
import { sendCatalogPdfByEmail } from '@/lib/catalog-pdf/send-catalog-by-email';

export const maxDuration = 60;

const COOLDOWN_MS = 5 * 60 * 1000;
const recentRequests = new Map<string, number>();

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const last = recentRequests.get(key);
  if (last && now - last < COOLDOWN_MS) {
    return false;
  }
  recentRequests.set(key, now);

  if (recentRequests.size > 500) {
    for (const [storedKey, storedAt] of recentRequests) {
      if (now - storedAt > COOLDOWN_MS) recentRequests.delete(storedKey);
    }
  }

  return true;
}

export async function POST(request: Request) {
  if (!isCatalogPdfEnabled()) {
    return NextResponse.json({ error: 'שליחת הקטלוג אינה זמינה כרגע' }, { status: 503 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'יש להזין כתובת אימייל תקינה' }, { status: 400 });
  }

  if (!checkRateLimit(email)) {
    return NextResponse.json(
      { error: 'כבר שלחנו קטלוג לכתובת הזו לפני זמן קצר — נסי שוב בעוד כמה דקות' },
      { status: 429 },
    );
  }

  try {
    const result = await sendCatalogPdfByEmail(email);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'שליחת המייל נכשלה' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `הקטלוג נשלח ל-${email}. בדקי גם בתיקיית הספאם.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליחת הקטלוג';
    console.error('Catalog email error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
