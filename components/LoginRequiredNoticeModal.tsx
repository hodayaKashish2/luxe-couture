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
          <span className="text-3xl block">{copy.emoji}</span>
          <h3 className="text-lg font-black text-neutral-900">{copy.title}</h3>
          <p className="text-sm text-[#6e5e62] leading-relaxed">{copy.body}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Link
              href={loginHref}
              className="inline-block px-5 py-3 bg-gradient-to-r from-[#6b2340] to-[#4a152c] text-white text-xs font-black rounded-xl"
            >
              התחברות / הרשמה
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-[#e3cfd3] text-[#6b2340] text-xs font-bold rounded-xl bg-white"
            >
              אולי אחר כך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
