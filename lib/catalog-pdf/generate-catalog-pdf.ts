import type { Browser } from 'puppeteer-core';
import { buildCatalogPrintHtml, type CatalogPrintHtmlOptions } from '@/lib/catalog-pdf/build-catalog-print-html';
import { withCompactCatalogImages } from '@/lib/catalog-pdf/catalog-image-url';
import { launchCatalogPdfBrowser } from '@/lib/catalog-pdf/launch-catalog-pdf-browser';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';

export type GenerateCatalogPdfOptions = {
  /** תמונות דחוסות — לשליחה במייל */
  compactImages?: boolean;
  printOptions?: CatalogPrintHtmlOptions;
  /** אם מועבר — לא נסגור את הדפדפן (לכמה קבצים ברצף) */
  browser?: Browser;
};

export async function generateCatalogPdf(
  dresses: CatalogPdfDress[],
  options?: GenerateCatalogPdfOptions,
): Promise<Buffer> {
  if (dresses.length === 0) {
    throw new Error('אין שמלות מאושרות בקטלוג');
  }

  const prepared = options?.compactImages ? withCompactCatalogImages(dresses) : dresses;
  const html = buildCatalogPrintHtml(prepared, options?.printOptions);
  const ownBrowser = !options?.browser;
  const browser = options?.browser ?? (await launchCatalogPdfBrowser());

  try {
    const page = await browser.newPage();
    try {
      const imageTimeoutMs = Math.min(45_000, 8_000 + dresses.length * 500);
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      await page.evaluate(async (timeoutMs) => {
        const imagesLoaded = Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true });
                  img.addEventListener('error', () => resolve(), { once: true });
                }),
          ),
        );
        await Promise.race([
          imagesLoaded,
          new Promise<void>((resolve) => {
            setTimeout(resolve, timeoutMs);
          }),
        ]);
      }, imageTimeoutMs);

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '6mm', bottom: '6mm', left: '5mm', right: '5mm' },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  } finally {
    if (ownBrowser) await browser.close();
  }
}
