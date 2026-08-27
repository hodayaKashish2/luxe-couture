import { createCatalogPdfResponse } from '@/lib/catalog-pdf/create-catalog-pdf-response';

export async function GET() {
  return createCatalogPdfResponse();
}
