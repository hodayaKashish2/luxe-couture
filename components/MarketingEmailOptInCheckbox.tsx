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
          ? 'border-[#6b2340] bg-[#fff9eb]'
          : 'border-[#ead8dc] bg-[#fffafb] hover:border-[#e3cfd3]'
      } ${compact ? 'p-3' : 'p-3.5'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 shrink-0 w-4 h-4 accent-[#6b2340] cursor-pointer"
      />
      <span className="min-w-0">
        <span className={`block font-black text-[#2c2426] ${compact ? 'text-xs' : 'text-sm'}`}>
          {MARKETING_EMAIL_OPT_IN_TITLE}
        </span>
        <span className={`block text-[#6e5e62] leading-relaxed mt-1 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {MARKETING_EMAIL_OPT_IN_BODY}
        </span>
        <span className={`block text-[#7a5e64] mt-1.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          {MARKETING_EMAIL_OPT_IN_FOOTER}
        </span>
        <span className={`block text-[#b8a888] mt-1 leading-snug ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
          {MARKETING_EMAIL_OPT_IN_LEGAL}
        </span>
      </span>
    </label>
  );
}
