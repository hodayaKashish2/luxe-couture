import { buildCatalogPrintHtml } from '@/lib/catalog-pdf/build-catalog-print-html';
import { launchCatalogPdfBrowser } from '@/lib/catalog-pdf/launch-catalog-pdf-browser';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';

export async function generateCatalogPdf(dresses: CatalogPdfDress[]): Promise<Buffer> {
  if (dresses.length === 0) {
    throw new Error('אין שמלות מאושרות בקטלוג');
  }

  const html = buildCatalogPrintHtml(dresses);
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
