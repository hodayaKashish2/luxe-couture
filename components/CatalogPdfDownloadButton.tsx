'use client';

import { useState } from 'react';

type CatalogPdfDownloadButtonProps = {
  className?: string;
  label?: string;
  busyLabel?: string;
  onError?: (message: string) => void;
  onSuccess?: () => void;
};

export default function CatalogPdfDownloadButton({
  className = 'text-[11px] font-bold text-[#b8860b] underline underline-offset-[3px] transition-colors hover:text-[#8b6508] disabled:opacity-60',
  label = '📥 הורד קטלוג PDF',
  busyLabel = 'מייצר PDF...',
  onError,
  onSuccess,
}: CatalogPdfDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function openPreview() {
    window.open('/api/catalog-pdf/preview', '_blank', 'noopener,noreferrer');
  }

  async function downloadCatalogPdf() {
    if (busy) return;
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/catalog-pdf');

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'יצירת הקטלוג נכשלה');
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('השרת לא החזיר קובץ PDF תקין');
      }

      const blob = await response.blob();
      if (blob.size < 1000) {
        throw new Error('קובץ ה-PDF ריק או פגום');
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `catalog-dress-click-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'יצירת הקטלוג נכשלה';
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 sm:items-end">
      <button
        type="button"
        onClick={() => void downloadCatalogPdf()}
        disabled={busy}
        className={className}
        title="קטלוג מלא לשמירה ושיתוף — לבנות בלי גישה לאתר"
      >
        {busy ? busyLabel : label}
      </button>
      {error && (
        <p className="max-w-[220px] text-center text-[10px] leading-snug text-red-600 sm:text-right">
          {error}
          <button
            type="button"
            onClick={openPreview}
            className="mt-1 block w-full font-bold text-[#8b6508] underline"
          >
            פתחי תצוגה מקדימה להדפסה
          </button>
        </p>
      )}
    </div>
  );
}
