'use client';

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
};

export default function MarketingEmailOptInCheckbox({ checked, onChange, compact = false }: Props) {
  return (
    <label
      className={`flex gap-3 cursor-pointer rounded-xl border-2 transition-colors ${
        checked
          ? 'border-[#d4af37] bg-[#fff9eb]'
          : 'border-[#eadaaf] bg-[#fffdf8] hover:border-[#decfa8]'
      } ${compact ? 'p-3' : 'p-3.5'}`}
    >
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
