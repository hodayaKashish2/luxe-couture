'use client';

import type { CatalogHighlight } from '@/lib/dress-ranking';

const COPY: Record<
  CatalogHighlight,
  { icon: string; title: string; subtitle: string }
> = {
  new: {
    icon: '✨',
    title: 'חדשה בקטלוג',
    subtitle: 'הצטרפה לאחרונה',
  },
  recommended: {
    icon: '💛',
    title: 'מומלצת',
    subtitle: 'בחירה מומלצת באתר',
  },
  in_demand: {
    icon: '⭐',
    title: 'מבוקשת',
    subtitle: 'נבחרה על ידי שוכרות',
  },
};

type Props = {
  highlight: CatalogHighlight;
  compact?: boolean;
};

export default function DressHighlightBadge({ highlight, compact = false }: Props) {
  const copy = COPY[highlight];

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 bg-gradient-to-l from-[#fffdf8] to-[#f3e9ec] text-[#6b2340] px-2 py-0.5 rounded-full text-[9px] font-black border border-[#e3cfd3]">
        <span aria-hidden>{copy.icon}</span>
        <span>{copy.title}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#d4b4bb] bg-gradient-to-l from-[#fffdf8] via-[#f8efd8] to-[#f3e9ec] px-2.5 py-2 shadow-sm">
      <span className="text-lg sm:text-xl shrink-0" aria-hidden>
        {copy.icon}
      </span>
      <div className="min-w-0 text-right leading-tight">
        <p className="text-[10px] sm:text-[11px] font-black text-[#2c2426]">{copy.title}</p>
        <p className="text-[8px] sm:text-[9px] text-[#6b2340] font-bold">{copy.subtitle}</p>
      </div>
    </div>
  );
}
