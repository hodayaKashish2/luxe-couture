import type { Dress } from '@/lib/types';
import { getCatalogHighlight } from '@/lib/dress-ranking';

type Props = {
  dress: Dress;
  inline?: boolean;
  /** מונה גולמי — רק באזור האישי למשכירה */
  ownerMode?: boolean;
};

/** תג חברתי לשוכרות — בלי מספר השכרות */
export default function RentalCountBadge({ dress, inline = false, ownerMode = false }: Props) {
  const count = dress.rental_count || 0;

  if (ownerMode) {
    if (count <= 0) return null;
    if (inline) {
      return (
        <span className="text-[10px] sm:text-[11px] text-[#6b2340] font-bold">
          {count} השכרות
        </span>
      );
    }
    return (
      <span className="bg-[#fffafb] border border-[#e3cfd3] text-[#6b2340] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
        {count} השכרות
      </span>
    );
  }

  const highlight = getCatalogHighlight(dress);
  if (!highlight) return null;

  const label =
    highlight === 'new'
      ? '✨ חדשה'
      : highlight === 'recommended'
        ? '💛 מומלצת'
        : '⭐ מבוקשת';

  if (inline) {
    return <span className="text-[10px] sm:text-[11px] text-[#6b2340] font-bold">{label}</span>;
  }

  return (
    <span className="bg-[#fffafb] border border-[#e3cfd3] text-[#6b2340] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
      {label}
    </span>
  );
}
