import { NextResponse } from 'next/server';
import { createCatalogPdfResponse } from '@/lib/catalog-pdf/create-catalog-pdf-response';

export const maxDuration = 60;

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

  return createCatalogPdfResponse();
}