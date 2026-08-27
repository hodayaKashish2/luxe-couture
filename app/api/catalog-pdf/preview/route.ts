import { NextResponse } from 'next/server';
import { buildCatalogPrintHtml } from '@/lib/catalog-pdf/build-catalog-print-html';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';
import { isCatalogPdfEnabled } from '@/lib/catalog-pdf/create-catalog-pdf-response';

export const maxDuration = 30;

export async function GET() {
  if (!isCatalogPdfEnabled()) {
    return NextResponse.json({ error: 'תצוגת הקטלוג אינה זמינה כרגע' }, { status: 503 });
  }

  try {
    const dresses = await fetchAllCatalogPdfDresses();
    const html = buildCatalogPrintHtml(dresses);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בטעינת הקטלוג';
    console.error('Catalog preview error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
