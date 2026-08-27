import { createCatalogPdfResponse } from '@/lib/catalog-pdf/create-catalog-pdf-response';

export const maxDuration = 60;

export async function GET() {
  return createCatalogPdfResponse();
}
