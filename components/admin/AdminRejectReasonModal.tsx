'use client';

import { useEffect, useState } from 'react';

type AdminRejectReasonModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export default function AdminRejectReasonModal({
  open,
  title,
  description,
  confirmLabel = 'שלחי דחייה',
  busy = false,
  onCancel,
  onConfirm,
}: AdminRejectReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setError('');
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError('נא לכתוב סיבה (לפחות 3 תווים)');
      return;
    }
    setError('');
    await onConfirm(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onCancel}
    >
      <form
        className="w-full max-w-lg rounded-2xl border-2 border-red-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="px-4 py-3 border-b border-red-100 bg-red-50">
          <h2 className="font-black text-lg text-[#3d2f24]">{title}</h2>
          <p className="text-xs text-[#6e634c] mt-1 leading-relaxed">{description}</p>
        </div>

        <div className="p-4 space-y-3">
          <label className="block text-xs font-bold text-[#8b6508]">
            סיבת הדחייה (תישלח ללקוחה במייל)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
            minLength={3}
            disabled={busy}
            placeholder="לדוגמה: התמונות לא ברורות מספיק / חסר מידה / התוכן לא מתאים..."
            className="w-full p-3 border border-[#decfa8] rounded-xl text-sm text-[#2c261a] resize-y focus:outline-none focus:border-[#d4af37] disabled:opacity-60"
          />
          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
        </div>

        <div className="px-4 py-3 border-t border-[#f0e8d0] bg-[#fffdf8] flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-bold text-[#6e634c] rounded-xl disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-red-600 text-white disabled:opacity-50"
          >
            {busy ? 'שולחת...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
