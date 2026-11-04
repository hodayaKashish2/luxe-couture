'use client';

import { useId } from 'react';
import Link from 'next/link';
import {
  MARKETING_EMAIL_OPT_IN_BODY,
  MARKETING_EMAIL_OPT_IN_FOOTER,
  MARKETING_EMAIL_OPT_IN_LEGAL,
  MARKETING_EMAIL_OPT_IN_TITLE,
} from '@/lib/marketing-email-copy';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
  variant?: 'marketing' | 'terms';
};

export default function MarketingEmailOptInCheckbox({
  checked,
  onChange,
  compact = false,
  variant = 'marketing',
}: Props) {
  const inputId = useId();
  const boxClass = `flex gap-3 rounded-xl border-2 transition-colors ${
    checked
      ? 'border-[#d4af37] bg-[#fff9eb]'
      : 'border-[#eadaaf] bg-[#fffdf8] hover:border-[#decfa8]'
  } ${compact ? 'p-3' : 'p-3.5'}`;

  if (variant === 'terms') {
    const textClass = `text-[#3d2f24] leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`;
    return (
      <div className={boxClass}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 shrink-0 w-4 h-4 accent-[#b8860b] cursor-pointer"
        />
        <span className={textClass}>
          <label htmlFor={inputId} className="cursor-pointer">
            אני מאשרת את{' '}
          </label>
          <Link href="/terms" className="font-bold underline text-[#8b6508]">
            תנאי השימוש
          </Link>
          <label htmlFor={inputId} className="cursor-pointer">
            {' '}
            באתר
          </label>
        </span>
      </div>
    );
  }

  return (
    <label className={`${boxClass} cursor-pointer`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 shrink-0 w-4 h-4 accent-[#b8860b] cursor-pointer"
      />
      <span className="min-w-0">
        <span className={`block font-black text-[#3d2f24] ${compact ? 'text-xs' : 'text-sm'}`}>
          {MARKETING_EMAIL_OPT_IN_TITLE}
        </span>
        <span className={`block text-[#6e634c] leading-relaxed mt-1 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {MARKETING_EMAIL_OPT_IN_BODY}
        </span>
        <span className={`block text-[#9a7b4f] mt-1.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          {MARKETING_EMAIL_OPT_IN_FOOTER}
        </span>
        <span className={`block text-[#b8a888] mt-1 leading-snug ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
          {MARKETING_EMAIL_OPT_IN_LEGAL}
        </span>
      </span>
    </label>
  );
}
