import { listingTypeLabel, normalizeListingType } from '@/lib/dress-listing';

type Props = {
  city?: string;
  listingType?: string;
};

/** עיר + השכרה/מכירה — תגיות בולטות בכרטיס קטלוג */
export default function DressCatalogMeta({ city, listingType }: Props) {
  const trimmedCity = city?.trim();
  const type = normalizeListingType(listingType);
  const typeLabel = listingTypeLabel(type);

  if (!trimmedCity && !typeLabel) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 min-w-0">
      {trimmedCity && (
        <span className="inline-flex items-center gap-0.5 max-w-full truncate bg-[#f4ebd4] text-[#5c4510] px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border border-[#decfa8] shadow-sm">
          <span aria-hidden>📍</span>
          <span className="truncate">{trimmedCity}</span>
        </span>
      )}
      {typeLabel && (
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-black tracking-wide shadow-sm ${
            type === 'sale'
              ? 'border-[#d4af37] bg-white text-[#b8860b]'
              : 'border-[#8b6508] bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white shadow-[0_1px_2px_rgba(92,69,16,0.25)]'
          }`}
        >
          {typeLabel}
        </span>
      )}
    </div>
  );
}
