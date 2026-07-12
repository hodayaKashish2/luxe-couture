import type { Dress } from '@/lib/types';

type Props = {
  dress: Dress;
  compact?: boolean;
};

export default function RentalCountBadge({ dress, compact = false }: Props) {
  const count = dress.rental_count || 0;

  if (count <= 0) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-[#eadaaf] bg-[#faf8f3] text-[#9a7b4f] font-bold ${
          compact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] sm:text-xs px-2.5 py-1'
        }`}
      >
        שמלה חדשה
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#2c261a] text-[#f4ebd4] font-black shadow-sm ${
        compact
          ? 'text-[10px] px-2.5 py-1'
          : 'text-[11px] sm:text-sm px-3 py-1.5'
      }`}
    >
      <span aria-hidden>🔥</span>
      <span>{count} השכרות</span>
    </span>
  );
}
