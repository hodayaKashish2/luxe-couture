'use client';

import {
  FITTING_CONFIRMATION_BODY,
  FITTING_CONFIRMATION_TITLE,
} from '@/lib/constants';

type FittingConfirmationModalProps = {
  dressName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function FittingConfirmationModal({
  dressName,
  onConfirm,
  onCancel,
}: FittingConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-neutral-900/65 backdrop-blur-md z-[90] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#6b2340] relative"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#6b2340] text-[#6b2340] w-8 h-8 rounded-full flex items-center justify-center border font-bold"
          aria-label="סגירה"
        >
          ✕
        </button>

        <div className="space-y-4 pt-1">
          <div className="text-center">
            <span className="text-3xl block mb-2">📏</span>
            <h3 className="text-lg font-black text-neutral-900">{FITTING_CONFIRMATION_TITLE}</h3>
            <p className="text-xs text-[#6b2340] font-bold mt-1">{dressName}</p>
          </div>

          <p className="text-sm text-[#6e5e62] leading-relaxed">{FITTING_CONFIRMATION_BODY}</p>

          <div className="bg-[#faf7f5] border border-[#ead8dc] rounded-xl p-3 text-xs text-[#6e5e62] leading-relaxed">
            <p className="font-bold text-neutral-900 mb-1">לא מדדת עדיין?</p>
            <p>לחצי קודם על «תיאום ומדידה עם המשכירה», תאמי מולה, ורק אז חזרי לשלוח בקשת אישור סופי.</p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-3.5 bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#6b2340] hover:to-[#4a152c] text-white text-xs font-black rounded-xl shadow-md transition-all"
            >
              כן — מדדתי והשמלה מתאימה לי ✓
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 text-[#6b2340] text-xs font-bold hover:underline"
            >
              עדיין לא — חזרה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
