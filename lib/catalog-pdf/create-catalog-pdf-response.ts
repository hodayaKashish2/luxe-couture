import { NextResponse } from 'next/server';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';
import { generateCatalogPdf } from '@/lib/catalog-pdf/generate-catalog-pdf';

/**
 * Vercel rejects a function response above 4.5MB.
 * Compact catalog cards measure about 160KB per dress, so 16 dresses stay near 2.6MB.
 */
export const DRESSES_PER_DOWNLOAD_PDF = 16;

/** Stay under the platform limit even if one part runs a little larger than the estimate. */
const MAX_DOWNLOAD_PDF_BYTES = 4_200_000;

export function isCatalogPdfEnabled() {
  return process.env.CATALOG_PDF_ENABLED !== 'false';
}

function partCountFor(total: number) {
  return Math.max(1, Math.ceil(total / DRESSES_PER_DOWNLOAD_PDF));
}

export async function createCatalogPdfResponse(request?: Request) {
  if (!isCatalogPdfEnabled()) {
    return NextResponse.json({ error: 'הורדת קטלוג PDF אינה זמינה כרגע' }, { status: 503 });
  }

  try {
    const dresses = await fetchAllCatalogPdfDresses();
    if (dresses.length === 0) {
      return NextResponse.json({ error: 'אין שמלות מאושרות בקטלוג' }, { status: 404 });
    }

    const parts = partCountFor(dresses.length);
    const requested = Number(request ? new URL(request.url).searchParams.get('part') || '1' : '1');
    const part = Number.isFinite(requested) ? Math.trunc(requested) : 1;
    if (part < 1 || part > parts) {
      return NextResponse.json({ error: 'חלק הקטלוג לא קיים' }, { status: 400 });
    }

    const start = (part - 1) * DRESSES_PER_DOWNLOAD_PDF;
    const slice = dresses.slice(start, start + DRESSES_PER_DOWNLOAD_PDF);
    const pdf = await generateCatalogPdf(slice, {
      compactImages: true,
      printOptions:
        parts > 1
          ? { partLabel: `חלק ${part} מתוך ${parts}` }
          : undefined,
    });

    if (pdf.byteLength > MAX_DOWNLOAD_PDF_BYTES) {
      return NextResponse.json(
        { error: 'חלק מהקטלוג גדול מדי להורדה. נסי שוב בעוד רגע.' },
        { status: 500 },
      );
    }

    const date = new Date().toISOString().slice(0, 10);
    const filename =
      parts === 1
        ? `catalog-dress-click-${date}.pdf`
        : `catalog-dress-click-${date}-part-${part}-of-${parts}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Catalog-Part': String(part),
        'X-Catalog-Parts': String(parts),
        'X-Catalog-Total': String(dresses.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה ביצירת PDF';
    console.error('Catalog PDF error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
