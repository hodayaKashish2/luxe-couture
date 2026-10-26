import { NextResponse } from 'next/server';
import { isCatalogPdfEnabled } from '@/lib/catalog-pdf/create-catalog-pdf-response';
import { sendCatalogPdfByEmail } from '@/lib/catalog-pdf/send-catalog-by-email';
import { DEFAULT_ADMIN_EMAIL } from '@/lib/site-config';

export const maxDuration = 120;

function verifyAdminToken(request: Request) {
  const token =
    request.headers.get('x-admin-token') ||
    new URL(request.url).searchParams.get('token');
  return Boolean(token && process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET);
}

export async function POST(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
  }

  if (!isCatalogPdfEnabled()) {
    return NextResponse.json({ error: 'שליחת הקטלוג אינה זמינה כרגע' }, { status: 503 });
  }

  try {
    const result = await sendCatalogPdfByEmail(DEFAULT_ADMIN_EMAIL);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'שליחת המייל נכשלה' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message:
        'message' in result && result.message
          ? result.message
          : `הקטלוג נשלח ל-${DEFAULT_ADMIN_EMAIL}.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליחת הקטלוג';
    console.error('Admin catalog email error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
