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
      <span className="inline-flex items-center gap-1 bg-gradient-to-l from-[#fffdf8] to-[#f4ebd4] text-[#8b6508] px-2 py-0.5 rounded-full text-[9px] font-black border border-[#decfa8]">
        <span aria-hidden>{copy.icon}</span>
        <span>{copy.title}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#e6c687] bg-gradient-to-l from-[#fffdf8] via-[#f8efd8] to-[#f4ebd4] px-2.5 py-2 shadow-sm">
      <span className="text-lg sm:text-xl shrink-0" aria-hidden>
        {copy.icon}
      </span>
      <div className="min-w-0 text-right leading-tight">
        <p className="text-[10px] sm:text-[11px] font-black text-[#3d2f24]">{copy.title}</p>
        <p className="text-[8px] sm:text-[9px] text-[#8b6508] font-bold">{copy.subtitle}</p>
      </div>
    </div>
  );
}
