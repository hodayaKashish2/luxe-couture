'use client';

import { useState } from 'react';

const actionBtnClass =
  'text-[11px] font-bold text-[#8b6508] px-3 py-1.5 border border-[#d4af37] rounded-lg bg-[#fff8e8] hover:bg-[#fff3d6] disabled:opacity-60 transition-colors';

type CatalogAccessActionsProps = {
  onError?: (message: string) => void;
  onEmailSuccess?: (message: string) => void;
};

export default function CatalogAccessActions({
  onError,
  onEmailSuccess,
}: CatalogAccessActionsProps) {
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

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

  async function sendCatalogEmail(event: React.FormEvent) {
    event.preventDefault();
    if (emailBusy) return;

    setEmailBusy(true);
    setEmailError('');
    setEmailMessage('');

    try {
      const response = await fetch('/api/catalog-pdf/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        linkOnly?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error || 'שליחת המייל נכשלה');
      }

      const successMessage =
        data.message ||
        (data.linkOnly
          ? 'שלחנו קישור לצפייה בקטלוג — בדקי את המייל (גם בספאם).'
          : 'הקטלוג נשלח בהצלחה!');
      setEmailMessage(successMessage);
      onEmailSuccess?.(successMessage);
      setEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שליחת המייל נכשלה';
      setEmailError(message);
      onError?.(message);
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:items-end">
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
          onClick={() => {
            setEmailOpen((open) => !open);
            setEmailError('');
            setEmailMessage('');
          }}
          className={actionBtnClass}
          title="קבלת הקטלוג כקובץ PDF במייל"
        >
          📧 שלחי במייל
        </button>
      </div>

      {emailOpen && (
        <form
          onSubmit={(event) => void sendCatalogEmail(event)}
          className="flex w-full max-w-[280px] flex-col gap-1.5 sm:items-end"
        >
          <div className="flex w-full gap-1.5">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="כתובת אימייל"
              dir="ltr"
              className="min-w-0 flex-1 rounded-lg border border-[#decfa8] bg-white px-2.5 py-1.5 text-[11px] text-[#2c261a] placeholder:text-[#9a7b4f] focus:border-[#d4af37] focus:outline-none"
            />
            <button
              type="submit"
              disabled={emailBusy}
              className="shrink-0 rounded-lg bg-[#2c261a] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#b8860b] disabled:opacity-60"
            >
              {emailBusy ? 'שולח...' : 'שלחי'}
            </button>
          </div>
          <p className="text-center text-[10px] leading-snug text-[#6e634c] sm:text-right">
            הקטלוג יישלח כ-PDF — לא דרך הורדה מהאתר
          </p>
        </form>
      )}

      {emailMessage && (
        <p className="max-w-[280px] text-center text-[10px] leading-snug text-emerald-700 sm:text-right">
          {emailMessage}
        </p>
      )}
      {emailError && (
        <p className="max-w-[280px] text-center text-[10px] leading-snug text-red-600 sm:text-right">
          {emailError}
        </p>
      )}
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
  );
}
