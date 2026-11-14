import Link from 'next/link';
import DressImageFill from '@/components/DressImageFill';
import type { SavedDress } from '@/lib/luxe-storage';

type Props = {
  items: SavedDress[];
  emptyMessage: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  onRemove: (id: string) => void;
  showTotal?: boolean;
  actionLabel?: string;
  getActionLabel?: (item: SavedDress) => string;
  onAction?: (item: SavedDress) => void;
  onViewDetails?: (item: SavedDress) => void;
};

export default function SavedDressList({
  items,
  emptyMessage,
  emptyActionLabel = 'לקטלוג →',
  emptyActionHref = '/',
  onRemove,
  showTotal = false,
  actionLabel,
  getActionLabel,
  onAction,
  onViewDetails,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-white/80 rounded-2xl border border-dashed border-[#e3cfd3]">
        <span className="text-4xl block mb-3 opacity-80">👗</span>
        <p className="text-sm text-[#6e5e62]">{emptyMessage}</p>
        <Link
          href={emptyActionHref}
          className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-[#6b2340] to-[#4a152c] text-white rounded-xl text-xs font-bold shadow-md"
        >
          {emptyActionLabel}
        </Link>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {items.map((item) => {
          const image = item.images?.[0];
          return (
            <li
              key={item.id}
              className="group flex gap-3 sm:gap-4 bg-white rounded-2xl border-2 border-[#e3cfd3]/70 p-3 sm:p-4 shadow-[0_8px_24px_rgba(212,175,55,0.08)] hover:border-[#6b2340] hover:shadow-[0_12px_32px_rgba(212,175,55,0.15)] transition-all"
            >
              <button
                type="button"
                onClick={() => onViewDetails?.(item)}
                disabled={!onViewDetails}
                className={`flex gap-3 sm:gap-4 flex-1 min-w-0 text-right items-stretch ${
                  onViewDetails ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="relative shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-[#ead8dc] bg-[#faf7f5]">
                  {image ? (
                    <DressImageFill
                      src={image}
                      alt={item.name}
                      className="h-full w-full"
                      fillMode="smart"
                      hoverScale
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-[#e3cfd3]">👗</div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-gradient-to-r from-[#6b2340] to-[#4a152c] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow">
                    {item.size || '—'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-bold text-sm sm:text-base text-[#2c2426] truncate group-hover:text-[#6b2340] transition-colors">
                    {item.name}
                  </h3>
                  {item.city && (
                    <p className="text-[10px] sm:text-xs text-[#7a5e64] mt-0.5">📍 {item.city}</p>
                  )}
                  {onViewDetails && (
                    <p className="text-[10px] text-[#6b2340] font-bold mt-1">לחצי לפרטים מלאים →</p>
                  )}
                  <p className="text-base sm:text-lg font-black text-[#2a1f22] mt-auto pt-1">
                    ₪{item.price}
                    <span className="text-[10px] font-bold text-[#7a5e64] mr-1">להשכרה</span>
                  </p>
                </div>
              </button>

              <div className="flex flex-col justify-end shrink-0">
                <div className="flex flex-col gap-2">
                  {(actionLabel || getActionLabel) && onAction && (
                    <button
                      type="button"
                      onClick={() => onAction(item)}
                      className="px-3 py-1.5 rounded-lg bg-[#2a1f22] hover:bg-[#6b2340] text-white text-[10px] font-bold transition-colors"
                    >
                      {getActionLabel ? getActionLabel(item) : actionLabel}
                    </button>
                  )}
                  <Link
                    href="/"
                    className="px-3 py-1.5 rounded-lg border border-[#e3cfd3] text-[#6b2340] text-[10px] font-bold hover:bg-[#fffafb]"
                  >
                    לקטלוג
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="px-3 py-1.5 rounded-lg text-red-600 border border-red-100 bg-red-50 text-[10px] font-bold hover:bg-red-100"
                  >
                    הסר
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {showTotal && (
        <div className="flex justify-between items-center bg-gradient-to-l from-[#fffafb] to-[#f3e9ec] rounded-xl border border-[#e3cfd3] px-4 py-3">
          <span className="text-xs font-bold text-[#6e5e62]">סה״כ משוער:</span>
          <span className="text-lg font-black text-[#2a1f22]">₪{total}</span>
        </div>
      )}
    </div>
  );
}
