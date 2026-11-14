'use client';

import Link from 'next/link';

import { OWN_DRESS_MESSAGES } from '@/lib/self-dress-guard';

type OwnDressNoticeModalProps = {
  dressName: string;
  variant: 'booking' | 'coordinate' | 'rating';
  onClose: () => void;
};

export default function OwnDressNoticeModal({
  dressName,
  variant,
  onClose,
}: OwnDressNoticeModalProps) {
  const copy = OWN_DRESS_MESSAGES[variant];

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[85] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#6b2340] relative"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#6b2340] text-[#6b2340] w-8 h-8 rounded-full flex items-center justify-center border font-bold"
        >
          ✕
        </button>
        <div className="text-center space-y-3 pt-2">
          <span className="text-3xl block">👗</span>
          <h3 className="text-lg font-black text-neutral-900">{copy.title}</h3>
          <p className="text-xs text-[#6e5e62] font-bold">{dressName}</p>
          <p className="text-sm text-[#6e5e62] leading-relaxed">{copy.body}</p>
          {variant === 'rating' ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-block mt-2 px-5 py-3 bg-gradient-to-r from-[#6b2340] to-[#4a152c] text-white text-xs font-black rounded-xl"
            >
              הבנתי, תודה
            </button>
          ) : (
            <Link
              href="/account?section=rentals"
              className="inline-block mt-2 px-5 py-3 bg-gradient-to-r from-[#6b2340] to-[#4a152c] text-white text-xs font-black rounded-xl"
            >
              לשמלות שלי →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
