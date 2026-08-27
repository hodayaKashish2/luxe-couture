import { NextResponse } from 'next/server';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';
import { generateCatalogPdf } from '@/lib/catalog-pdf/generate-catalog-pdf';

export function isCatalogPdfEnabled() {
  return process.env.CATALOG_PDF_ENABLED === 'true' || process.env.NODE_ENV === 'development';
}

export async function createCatalogPdfResponse() {
  if (!isCatalogPdfEnabled()) {
    return NextResponse.json({ error: 'הורדת קטלוג PDF אינה זמינה כרגע' }, { status: 503 });
  }

  try {
    const dresses = await fetchAllCatalogPdfDresses();
    const pdf = await generateCatalogPdf(dresses);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="catalog-dress-click-${date}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה ביצירת PDF';
    console.error('Catalog PDF error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
