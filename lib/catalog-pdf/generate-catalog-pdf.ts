import { buildCatalogPrintHtml } from '@/lib/catalog-pdf/build-catalog-print-html';
import { withCompactCatalogImages } from '@/lib/catalog-pdf/catalog-image-url';
import { launchCatalogPdfBrowser } from '@/lib/catalog-pdf/launch-catalog-pdf-browser';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';

export type GenerateCatalogPdfOptions = {
  /** תמונות דחוסות — לשליחה במייל */
  compactImages?: boolean;
};

export async function generateCatalogPdf(
  dresses: CatalogPdfDress[],
  options?: GenerateCatalogPdfOptions,
): Promise<Buffer> {
  if (dresses.length === 0) {
    throw new Error('אין שמלות מאושרות בקטלוג');
  }

  const prepared = options?.compactImages ? withCompactCatalogImages(dresses) : dresses;
  const html = buildCatalogPrintHtml(prepared);
  const browser = await launchCatalogPdfBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 180000,
    });

    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true });
                  img.addEventListener('error', () => resolve(), { once: true });
                }),
        ),
      );
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '6mm', bottom: '6mm', left: '5mm', right: '5mm' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
