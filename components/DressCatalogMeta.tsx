import { listingTypeLabel, normalizeListingType } from '@/lib/dress-listing';

type Props = {
  city?: string;
  listingType?: string;
};

export default function DressCatalogMeta({ city, listingType }: Props) {
  const trimmedCity = city?.trim();
  const type = normalizeListingType(listingType);
  const typeLabel = listingTypeLabel(type);

  if (!trimmedCity && !typeLabel) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      {trimmedCity && (
        <span className="max-w-[72%] truncate text-[11px] text-[#7a5e64]">{trimmedCity}</span>
      )}
      {typeLabel && (
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            type === 'sale' ? 'bg-[#f3e9ec] text-[#6b2340]' : 'bg-[#f7f1ee] text-[#6e5e62]'
          }`}
        >
          {typeLabel}
        </span>
      )}
    </div>
  );
}
