import { sendEmailWithAttachmentTo } from '@/lib/email';
import { SITE_NAME } from '@/lib/site-config';
import { fetchAllCatalogPdfDresses } from '@/lib/catalog-pdf/fetch-all-catalog-dresses';
import { generateCatalogPdf } from '@/lib/catalog-pdf/generate-catalog-pdf';
import { launchCatalogPdfBrowser } from '@/lib/catalog-pdf/launch-catalog-pdf-browser';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';

/**
 * 90 שמלות כבר נשלחו בהצלחה במייל; 120 נכשלו.
 * זה גם חיתוך ראשוני לפני מדידת גודל הקובץ.
 */
const DRESSES_PER_PDF = 90;

/**
 * Gmail ~25MB אחרי קידוד base64 (~33% תוספת).
 * 15MB לקובץ גולמי נשאר מתחת למגבלה בפועל.
 */
const MAX_EMAIL_ATTACHMENT_BYTES = 15 * 1024 * 1024;

type CatalogPdfPart = {
  pdf: Buffer;
  dresses: CatalogPdfDress[];
};

function chunkDresses<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function buildCatalogEmailHtml(params: {
  totalDresses: number;
  partCount: number;
  parts: { partIndex: number; fromIndex: number; toIndex: number }[];
}) {
  const { totalDresses, partCount, parts } = params;
  const isMulti = partCount > 1;
  const partsList = parts
    .map(
      (part) =>
        `<li>חלק ${part.partIndex} מתוך ${partCount} — שמלות ${part.fromIndex}–${part.toIndex}</li>`,
    )
    .join('');

  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
      <h2 style="color:#3d2f24;margin-top:0;">קטלוג ${SITE_NAME}</h2>
      ${
        isMulti
          ? `<p style="line-height:1.7;color:#554a33;">מצורפים <strong>${partCount} קבצי PDF</strong> עם ${totalDresses} שמלות מהקטלוג.</p>
             <p style="line-height:1.7;color:#554a33;">הקטלוג פוצל לכמה קבצים באותו מייל, כדי שכל קובץ יישאר בגודל שאפשר לשלוח:</p>
             <ul style="line-height:1.7;color:#554a33;padding-right:18px;">${partsList}</ul>`
          : `<p style="line-height:1.7;color:#554a33;">מצורף קובץ PDF עם ${totalDresses} שמלות מהקטלוג.</p>`
      }
    </div>
  `;
}

export async function sendCatalogPdfByEmail(to: string) {
  const dresses = await fetchAllCatalogPdfDresses();
  const totalDresses = dresses.length;
  if (totalDresses === 0) {
    return { success: false as const, error: 'אין שמלות מאושרות בקטלוג' };
  }

  const date = new Date().toISOString().slice(0, 10);
  const browser = await launchCatalogPdfBrowser();
  const parts: CatalogPdfPart[] = [];

  try {
    for (const chunk of chunkDresses(dresses, DRESSES_PER_PDF)) {
      const fitted = await splitChunkToEmailSize(chunk, browser);
      parts.push(...fitted);
    }
  } finally {
    await browser.close();
  }

  let fromCursor = 1;
  const numberedParts = parts.map((part) => {
    const fromIndex = fromCursor;
    const toIndex = fromCursor + part.dresses.length - 1;
    fromCursor = toIndex + 1;
    return { ...part, fromIndex, toIndex };
  });

  const partCount = numberedParts.length;
  const attachments = numberedParts.map((part, i) => ({
    filename:
      partCount === 1
        ? `catalog-dress-click-${date}.pdf`
        : `catalog-dress-click-${date}-part-${i + 1}-of-${partCount}.pdf`,
    content: part.pdf,
    contentType: 'application/pdf',
  }));

  const subject =
    partCount === 1
      ? `${SITE_NAME} — קטלוג שמלות מלא`
      : `${SITE_NAME} — קטלוג שמלות (${partCount} קבצי PDF)`;

  const attachmentResult = await sendEmailWithAttachmentTo(
    to,
    subject,
    buildCatalogEmailHtml({
      totalDresses,
      partCount,
      parts: numberedParts.map((part, i) => ({
        partIndex: i + 1,
        fromIndex: part.fromIndex,
        toIndex: part.toIndex,
      })),
    }),
    attachments,
  );

  if (!attachmentResult.success) {
    return attachmentResult;
  }

  return {
    success: true as const,
    linkOnly: false as const,
    message:
      partCount === 1
        ? `הקטלוג נשלח ל-${to} כ-PDF. בדקי גם בתיקיית הספאם.`
        : `הקטלוג נשלח ל-${to} במייל אחד עם ${partCount} קבצי PDF. בדקי גם בתיקיית הספאם.`,
  };
}

async function splitChunkToEmailSize(
  dresses: CatalogPdfDress[],
  browser: Awaited<ReturnType<typeof launchCatalogPdfBrowser>>,
): Promise<CatalogPdfPart[]> {
  const pdf = await generateCatalogPdf(dresses, {
    compactImages: true,
    browser,
  });

  if (pdf.length <= MAX_EMAIL_ATTACHMENT_BYTES || dresses.length === 1) {
    return [{ pdf, dresses }];
  }

  const mid = Math.ceil(dresses.length / 2);
  const left = await splitChunkToEmailSize(dresses.slice(0, mid), browser);
  const right = await splitChunkToEmailSize(dresses.slice(mid), browser);
  return [...left, ...right];
}
