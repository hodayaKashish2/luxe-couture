import { listingTypeLabel, normalizeListingType } from '@/lib/dress-listing';

type Props = {
  city?: string;
  listingType?: string;
};

/** עיר + השכרה/מכירה — שורה דקה בכרטיס קטלוג */
export default function DressCatalogMeta({ city, listingType }: Props) {
  const trimmedCity = city?.trim();
  const type = normalizeListingType(listingType);
  const typeLabel = listingTypeLabel(type);

  if (!trimmedCity && !typeLabel) return null;

  return (
    <p className="flex items-center gap-1 min-w-0 text-[9px] sm:text-[10px] leading-tight">
      {trimmedCity && (
        <span className="truncate min-w-0 text-[#9a7b4f]">{trimmedCity}</span>
      )}
      {trimmedCity && typeLabel && (
        <span className="shrink-0 text-[#decfa8]" aria-hidden>
          ·
        </span>
      )}
      <span
        className={`shrink-0 font-bold ${
          type === 'sale' ? 'text-emerald-700' : 'text-[#8b6508]'
        }`}
      >
        {typeLabel}
      </span>
    </p>
  );
}
