'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSafeModalBackdropClose } from '@/hooks/use-safe-modal-backdrop-close';

type Step = 'form' | 'loading' | 'success' | 'error';

type CatalogEmailModalProps = {
  open: boolean;
  onClose: () => void;
  onError?: (message: string) => void;
};

export default function CatalogEmailModal({ open, onClose, onError }: CatalogEmailModalProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('form');
      setEmail('');
      setError('');
    }
  }, [open]);

  function handleClose() {
    if (step === 'loading') return;
    onClose();
  }

  const stableClose = useCallback(() => {
    if (step === 'loading') return;
    onClose();
  }, [onClose, step]);

  const { onBackdropMouseDown, onPanelMouseDown, onBackdropClick } = useSafeModalBackdropClose(
    stableClose,
    step !== 'loading',
  );

  useEffect(() => {
    if (step !== 'success') return;
    const timer = window.setTimeout(stableClose, 2800);
    return () => window.clearTimeout(timer);
  }, [step, stableClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === 'loading') return;

    setStep('loading');
    setError('');

    try {
      const response = await fetch('/api/catalog-pdf/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'שליחת המייל נכשלה');
      }

      setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שליחת המייל נכשלה';
      setError(message);
      setStep('error');
      onError?.(message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-md"
      onMouseDown={onBackdropMouseDown}
      onClick={onBackdropClick}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border-2 border-[#d4af37] bg-white p-6 shadow-2xl"
        dir="rtl"
        onMouseDown={onPanelMouseDown}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-email-title"
      >
        {step !== 'loading' && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border bg-neutral-100 font-bold text-[#b8860b] hover:bg-[#d4af37]"
            aria-label="סגירה"
          >
            ✕
          </button>
        )}

        {step === 'form' && (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 pt-1">
            <div className="space-y-1.5 text-center sm:text-right">
              <span className="text-2xl" aria-hidden>
                📧
              </span>
              <h3 id="catalog-email-title" className="text-base font-black text-neutral-900">
                שליחת הקטלוג במייל
              </h3>
              <p className="text-xs leading-relaxed text-[#6e634c]">
                הזיני כתובת אימייל — נשלח אלייך את הקטלוג המלא.
              </p>
            </div>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@gmail.com"
              dir="ltr"
              className="w-full rounded-xl border border-[#decfa8] bg-white px-3 py-2.5 text-sm text-[#2c261a] placeholder:text-[#9a7b4f] focus:border-[#d4af37] focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] py-3 text-xs font-black text-white shadow-md hover:from-[#b8860b] hover:to-[#8b6508]"
            >
              שלחי
            </button>
          </form>
        )}

        {step === 'loading' && (
          <div className="space-y-3 py-4 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#decfa8] border-t-[#b8860b]" />
            <p className="text-sm font-bold text-[#3d2f24]">מכינים את הקובץ ושולחים למייל...</p>
            <p className="text-xs text-[#6e634c]">זה עלול לקחת כדקה — אל תסגרי את החלון</p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-3 py-2 text-center">
            <span className="text-3xl" aria-hidden>
              ✅
            </span>
            <p className="text-sm font-bold leading-relaxed text-emerald-800">
              הקטלוג נשלח למייל
              <span className="block text-xs font-semibold text-[#6e634c] mt-1">
                (בדקי גם בתיקיית ספאם)
              </span>
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs font-bold text-[#b8860b] underline underline-offset-2"
            >
              סגור
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2 text-center sm:text-right">
              <p className="text-sm font-bold text-red-600">{error}</p>
              <a
                href="/catalog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-[#8b6508] underline"
              >
                אפשר גם לצפות בקטלוג בדפדפן
              </a>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
                className="flex-1 rounded-xl border border-[#decfa8] py-2.5 text-xs font-bold text-[#8b6508]"
              >
                נסי שוב
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl bg-[#2c261a] py-2.5 text-xs font-bold text-white"
              >
                סגור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
