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
      <span className="inline-flex items-center gap-1 bg-gradient-to-l from-[#2a1f22] to-[#4a3f2b] text-[#f6eef1] px-2 py-0.5 rounded-full text-[9px] font-black border border-[#6b2340]/40">
        <span aria-hidden>{copy.icon}</span>
        <span>{copy.title}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#d4b4bb] bg-gradient-to-l from-[#fffafb] via-[#f8efd8] to-[#f3e9ec] px-2.5 py-2 shadow-sm">
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
