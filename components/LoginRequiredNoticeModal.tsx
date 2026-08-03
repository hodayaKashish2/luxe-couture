'use client';

import Link from 'next/link';

import { loginUrl } from '@/lib/require-login';

type LoginRequiredContext = 'rate' | 'review';

const COPY: Record<
  LoginRequiredContext,
  { title: string; body: string; emoji: string }
> = {
  rate: {
    emoji: '⭐',
    title: 'כדי לדרג שמלה — צריך חשבון',
    body: 'הדירוגים נשמרים לפי משתמשת, ולכן יש להתחבר או להירשם לפני דירוג שמלה.',
  },
  review: {
    emoji: '💬',
    title: 'כדי לשתף חוויה — צריך חשבון',
    body: 'תגובות על האתר נשמרות לפי משתמשת. התחברי או הירשמי כדי לשתף את החוויה שלך.',
  },
};

type LoginRequiredNoticeModalProps = {
  context: LoginRequiredContext;
  nextPath?: string;
  onClose: () => void;
};

export default function LoginRequiredNoticeModal({
  context,
  nextPath,
  onClose,
}: LoginRequiredNoticeModalProps) {
  const copy = COPY[context];
  const loginHref = loginUrl(nextPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'));

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[85] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#d4af37] relative"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center border font-bold"
        >
          ✕
        </button>
        <div className="text-center space-y-3 pt-2">
          <span className="text-3xl block">{copy.emoji}</span>
          <h3 className="text-lg font-black text-neutral-900">{copy.title}</h3>
          <p className="text-sm text-[#5c5037] leading-relaxed">{copy.body}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Link
              href={loginHref}
              className="inline-block px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl"
            >
              התחברות / הרשמה
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-[#decfa8] text-[#8b6508] text-xs font-bold rounded-xl bg-white"
            >
              אולי אחר כך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
