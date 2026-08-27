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

  async function downloadCatalogPdf() {
    if (busy) return;
    setBusy(true);

    try {
      const response = await fetch('/api/catalog-pdf');

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'יצירת הקטלוג נכשלה');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `catalog-dress-click-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'יצירת הקטלוג נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void downloadCatalogPdf()}
      disabled={busy}
      className={className}
      title="קטלוג מלא לשמירה ושיתוף — לבנות בלי גישה לאתר"
    >
      {busy ? busyLabel : label}
    </button>
  );
}
