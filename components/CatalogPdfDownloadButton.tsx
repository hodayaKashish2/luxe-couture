'use client';

import { useState } from 'react';
import { downloadCatalogPdf as saveCatalogPdf } from '@/lib/catalog-pdf/download-catalog-pdf-client';

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
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  function openPreview() {
    window.open('/catalog', '_blank', 'noopener,noreferrer');
  }

  async function downloadCatalogPdf() {
    if (busy) return;
    setBusy(true);
    setError('');

    try {
      await saveCatalogPdf({
        endpoint: '/api/catalog-pdf',
        onProgress: (part, parts) => {
          setProgress(parts > 1 ? `מייצר PDF ${part}/${parts}...` : busyLabel);
        },
      });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'יצירת הקטלוג נכשלה';
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
      setProgress('');
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
        {busy ? progress || busyLabel : label}
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
