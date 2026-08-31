import { listingTypeLabel, normalizeListingType } from '@/lib/dress-listing';

type Props = {
  city?: string;
  listingType?: string;
};

/** עיר + השכרה/מכירה — תגיות קומפקטיות בכרטיס קטלוג */
export default function DressCatalogMeta({ city, listingType }: Props) {
  const trimmedCity = city?.trim();
  const type = normalizeListingType(listingType);
  const typeLabel = listingTypeLabel(type);

  if (!trimmedCity && !typeLabel) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 min-w-0">
      {trimmedCity && (
        <span className="inline-flex items-center gap-0.5 max-w-[72%] truncate rounded-full border border-[#decfa8]/80 bg-[#f4ebd4]/90 px-1.5 py-px text-[9px] sm:text-[10px] font-semibold text-[#6e5530] leading-none">
          <span aria-hidden className="text-[8px] sm:text-[9px]">
            📍
          </span>
          <span className="truncate">{trimmedCity}</span>
        </span>
      )}
      {typeLabel && (
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[9px] sm:text-[10px] font-bold leading-none ${
            type === 'sale'
              ? 'border-[#d4af37] bg-white text-[#b8860b]'
              : 'border-[#c9a227] bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white'
          }`}
        >
          {typeLabel}
        </span>
      )}
    </div>
  );
}
