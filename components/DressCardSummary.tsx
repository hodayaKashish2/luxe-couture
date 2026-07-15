import type { Dress } from '@/lib/types';
import RentalCountBadge from '@/components/RentalCountBadge';

type Props = {
  dress: Dress;
  onShowDetails: () => void;
};

/** תצוגה קצרה בכרטיס — ללא מידה (מוצגת על התמונה) */
export default function DressCardSummary({ dress, onShowDetails }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <RentalCountBadge dress={dress} />
        {dress.city && (
          <span className="bg-[#f4ebd4] text-[#8b6508] px-2.5 py-0.5 rounded-full font-bold">
            📍 {dress.city}
          </span>
        )}
        {dress.event_type && (
          <span className="bg-neutral-100 text-[#6e634c] px-2.5 py-0.5 rounded-full">
            {dress.event_type}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onShowDetails();
        }}
        className="text-[11px] font-bold text-[#b8860b] hover:text-[#8b6508] underline underline-offset-2 cursor-pointer transition-colors hover:drop-shadow-sm"
      >
        ℹ️ פרטים מלאים
      </button>
    </div>
  );
}
