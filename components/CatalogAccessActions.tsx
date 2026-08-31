'use client';

import { useState } from 'react';
import CatalogEmailModal from '@/components/CatalogEmailModal';

const actionBtnClass =
  'text-[11px] font-bold text-[#8b6508] px-3 py-1.5 border border-[#d4af37] rounded-lg bg-[#fff8e8] hover:bg-[#fff3d6] disabled:opacity-60 transition-colors';

type CatalogAccessActionsProps = {
  onError?: (message: string) => void;
};

export default function CatalogAccessActions({ onError }: CatalogAccessActionsProps) {
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  async function downloadCatalogPdf() {
    if (downloadBusy) return;
    setDownloadBusy(true);
    setDownloadError('');

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'יצירת הקטלוג נכשלה';
      setDownloadError(message);
      onError?.(message);
    } finally {
      setDownloadBusy(false);
    }
  }

  return (
    <>
      <div className="flex w-full flex-col items-center gap-1.5 sm:w-auto sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <a
            href="/catalog"
            target="_blank"
            rel="noopener noreferrer"
            className={actionBtnClass}
            title="צפייה בכל השמלות בדפדפן — מתאים גם לנטפרי"
          >
            📖 צפייה בקטלוג
          </a>
          <button
            type="button"
            onClick={() => void downloadCatalogPdf()}
            disabled={downloadBusy}
            className={actionBtnClass}
            title="קובץ PDF לשמירה ושיתוף"
          >
            {downloadBusy ? 'מייצר PDF...' : '📥 הורד PDF'}
          </button>
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className={actionBtnClass}
            title="קבלת הקטלוג במייל"
          >
            📧 שליחת הקטלוג במייל
          </button>
        </div>

        {downloadError && (
          <p className="max-w-[280px] text-center text-[10px] leading-snug text-red-600 sm:text-right">
            {downloadError}
            <a
              href="/catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block font-bold text-[#8b6508] underline"
            >
              נסי צפייה בקטלוג בדפדפן
            </a>
          </p>
        )}
      </div>

      <CatalogEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onError={onError}
      />
    </>
  );
}
