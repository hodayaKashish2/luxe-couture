import { sendEmailTo, sendEmailWithAttachmentTo } from '@/lib/email';
import { SITE_NAME, getServerAppUrl } from '@/lib/site-config';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';
import { generateCatalogPdf } from '@/lib/catalog-pdf/generate-catalog-pdf';

/** גבול בטוח למצורף במייל (Gmail ~25MB, Resend עד 40MB) */
const MAX_EMAIL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function catalogUrl() {
  return `${getServerAppUrl().replace(/\/$/, '')}/catalog`;
}

function buildCatalogLinkEmailHtml(dressCount: number, linkOnly = false) {
  const url = catalogUrl();
  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
      <h2 style="color:#3d2f24;margin-top:0;">קטלוג ${SITE_NAME}</h2>
      ${
        linkOnly
          ? `<p style="line-height:1.7;color:#554a33;">הקטלוג גדול מדי לשליחה כקובץ PDF במייל (${dressCount} שמלות).</p>
             <p style="line-height:1.7;color:#554a33;">שלחנו לך <strong>קישור לצפייה בדפדפן</strong> — בלי הורדה, מתאים גם לנטפרי:</p>`
          : `<p style="line-height:1.7;color:#554a33;">מצורף קובץ PDF עם ${dressCount} שמלות מהקטלוג.</p>
             <p style="line-height:1.7;color:#554a33;">אפשר גם <a href="${url}" style="color:#b8860b;font-weight:bold;">לצפות בקטלוג בדפדפן</a> — בלי הורדה.</p>`
      }
      <p style="margin-top:20px;">
        <a href="${url}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
          ${linkOnly ? 'לצפייה בקטלוג המלא →' : 'לצפייה בקטלוג בדפדפן →'}
        </a>
      </p>
      <p style="line-height:1.7;color:#6e634c;font-size:13px;margin-top:16px;">אם הקובץ לא נפתח — פתחי את המייל באפליקציית Gmail בטלפון, או השתמשי בקישור למעלה.</p>
    </div>
  `;
}

async function sendCatalogLinkByEmail(to: string, dressCount: number) {
  return sendEmailTo(
    to,
    `${SITE_NAME} — קישור לקטלוג שמלות`,
    buildCatalogLinkEmailHtml(dressCount, true),
  );
}

function isAttachmentTooLargeError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes('size limit') || lower.includes('too large') || lower.includes('max message size');
}

export async function sendCatalogPdfByEmail(to: string) {
  const dresses = await fetchAllCatalogPdfDresses();
  const dressCount = dresses.length;
  const date = new Date().toISOString().slice(0, 10);
  const filename = `catalog-dress-click-${date}.pdf`;

  const pdf = await generateCatalogPdf(dresses, { compactImages: true });

  if (pdf.length > MAX_EMAIL_ATTACHMENT_BYTES) {
    const linkResult = await sendCatalogLinkByEmail(to, dressCount);
    if (!linkResult.success) return linkResult;
    return {
      ...linkResult,
      linkOnly: true as const,
      message:
        'הקטלוג גדול מדי למייל כ-PDF — שלחנו קישור לצפייה בדפדפן (מתאים גם לנטפרי).',
    };
  }

  const attachmentResult = await sendEmailWithAttachmentTo(
    to,
    `${SITE_NAME} — קטלוג שמלות מלא`,
    buildCatalogLinkEmailHtml(dressCount, false),
    {
      filename,
      content: pdf,
      contentType: 'application/pdf',
    },
  );

  if (!attachmentResult.success && isAttachmentTooLargeError(attachmentResult.error || '')) {
    const linkResult = await sendCatalogLinkByEmail(to, dressCount);
    if (!linkResult.success) return linkResult;
    return {
      ...linkResult,
      linkOnly: true as const,
      message:
        'הקטלוג גדול מדי למייל כ-PDF — שלחנו קישור לצפייה בדפדפן (מתאים גם לנטפרי).',
    };
  }

  if (!attachmentResult.success) {
    return attachmentResult;
  }

  return {
    ...attachmentResult,
    linkOnly: false as const,
    message: `הקטלוג נשלח ל-${to} כ-PDF. בדקי גם בתיקיית הספאם.`,
  };
}
