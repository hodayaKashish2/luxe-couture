import { sendEmailWithAttachmentTo } from '@/lib/email';
import { SITE_NAME, getServerAppUrl } from '@/lib/site-config';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';
import { generateCatalogPdf } from '@/lib/catalog-pdf/generate-catalog-pdf';

export async function sendCatalogPdfByEmail(to: string) {
  const dresses = await fetchAllCatalogPdfDresses();
  const pdf = await generateCatalogPdf(dresses);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `catalog-dress-click-${date}.pdf`;
  const catalogUrl = `${getServerAppUrl().replace(/\/$/, '')}/catalog`;

  return sendEmailWithAttachmentTo(
    to,
    `${SITE_NAME} — קטלוג שמלות מלא`,
    `
      <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
        <h2 style="color:#3d2f24;margin-top:0;">קטלוג ${SITE_NAME}</h2>
        <p style="line-height:1.7;color:#554a33;">מצורף קובץ PDF עם ${dresses.length} שמלות מהקטלוג.</p>
        <p style="line-height:1.7;color:#554a33;">אפשר גם <a href="${catalogUrl}" style="color:#b8860b;font-weight:bold;">לצפות בקטלוג בדפדפן</a> — בלי הורדה.</p>
        <p style="line-height:1.7;color:#6e634c;font-size:13px;margin-top:16px;">אם הקובץ לא נפתח — נסי לפתוח את המייל באפליקציית Gmail בטלפון.</p>
      </div>
    `,
    {
      filename,
      content: pdf,
      contentType: 'application/pdf',
    },
  );
}
