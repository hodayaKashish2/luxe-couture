import { PDFDocument } from 'pdf-lib';

type DownloadCatalogPdfOptions = {
  endpoint: string;
  headers?: HeadersInit;
  onProgress?: (part: number, parts: number) => void;
};

function savePdf(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function fetchPdfPart(endpoint: string, part: number, headers?: HeadersInit) {
  const separator = endpoint.includes('?') ? '&' : '?';
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${endpoint}${separator}part=${part}`, { headers });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        const error = new Error(data.error || 'יצירת הקטלוג נכשלה');
        if (response.status < 500 || attempt === 1) throw error;
        lastError = error;
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('השרת לא החזיר קובץ PDF תקין');
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength < 1000) {
        throw new Error('קובץ ה-PDF ריק או פגום');
      }

      return {
        bytes,
        parts: Number(response.headers.get('x-catalog-parts') || '1'),
        total: Number(response.headers.get('x-catalog-total') || '0'),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('יצירת הקטלוג נכשלה');
      if (attempt === 1) throw lastError;
    }
  }

  throw lastError ?? new Error('יצירת הקטלוג נכשלה');
}

async function mergePdfParts(parts: Uint8Array[]) {
  if (parts.length === 1) return parts[0];

  const merged = await PDFDocument.create();
  for (const part of parts) {
    const document = await PDFDocument.load(part);
    const pages = await merged.copyPages(document, document.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  return merged.save();
}

export async function downloadCatalogPdf({
  endpoint,
  headers,
  onProgress,
}: DownloadCatalogPdfOptions) {
  onProgress?.(1, 1);
  const first = await fetchPdfPart(endpoint, 1, headers);
  const parts = Number.isFinite(first.parts) && first.parts > 0 ? first.parts : 1;
  const buffers = [first.bytes];

  for (let part = 2; part <= parts; part += 1) {
    onProgress?.(part, parts);
    const next = await fetchPdfPart(endpoint, part, headers);
    buffers.push(next.bytes);
  }

  const pdf = await mergePdfParts(buffers);
  const date = new Date().toISOString().slice(0, 10);
  savePdf(pdf, `catalog-dress-click-${date}.pdf`);

  return {
    parts,
    total: first.total,
  };
}
