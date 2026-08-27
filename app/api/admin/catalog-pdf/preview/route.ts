import { NextResponse } from 'next/server';
import { buildCatalogPrintHtml } from '@/lib/catalog-pdf/build-catalog-print-html';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';

function verifyAdminToken(request: Request) {
  const token =
    request.headers.get('x-admin-token') ||
    new URL(request.url).searchParams.get('token');
  return Boolean(token && process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET);
}

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
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
