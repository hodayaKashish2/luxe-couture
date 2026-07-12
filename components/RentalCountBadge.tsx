import type { Dress } from '@/lib/types';

type Props = {
  dress: Dress;
  inline?: boolean;
};

/** תג עדין למספר השכרות — מעט יותר בולט מהמקור */
export default function RentalCountBadge({ dress, inline = false }: Props) {
  const count = dress.rental_count || 0;
  if (count <= 0) return null;

  if (inline) {
    return (
      <span className="text-[10px] sm:text-[11px] text-[#8b6508] font-bold">
        {count} השכרות
      </span>
    );
  }

  return (
    <span className="bg-[#fffdf8] border border-[#decfa8] text-[#8b6508] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
      {count} השכרות
    </span>
  );
}
