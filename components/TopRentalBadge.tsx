type Props = {
  rank: number;
  compact?: boolean;
};

const RANK_COPY: Record<number, { icon: string; title: string; subtitle: string }> = {
  1: { icon: '🏆', title: 'הכי מושכרת', subtitle: 'גביע · מקום 1 בקטלוג' },
  2: { icon: '🥈', title: 'מושכרת מאוד', subtitle: 'מקום 2 בקטלוג' },
  3: { icon: '🥉', title: 'פופולרית', subtitle: 'מקום 3 בקטלוג' },
};

export default function TopRentalBadge({ rank, compact = false }: Props) {
  const copy = RANK_COPY[rank];
  if (!copy) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 bg-gradient-to-l from-[#2c261a] to-[#4a3f2b] text-[#f4ebd4] px-2 py-0.5 rounded-full text-[9px] font-black border border-[#d4af37]/40">
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
