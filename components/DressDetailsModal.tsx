'use client';

import { useEffect, useState } from 'react';
import type { Dress } from '@/lib/types';
import DressImageFill from '@/components/DressImageFill';
import DressImageSliderNav, { stepImageIndex } from '@/components/DressImageSliderNav';
import DressRatingsSection from '@/components/DressRatingsSection';
import { DRESS_DETAIL_NOT_SPECIFIED, getCleanDescription, getDressDetailRows } from '@/lib/dress-display';

type Props = {
  dress: Dress;
  onClose: () => void;
  initialImageIndex?: number;
  onReserve?: () => void;
  onToggleCart?: () => void;
  onToggleFavorite?: () => void;
  onCoordinate?: () => void;
  onRate?: () => void;
  onShare?: () => void;
  isInCart?: boolean;
  isFavorite?: boolean;
};

const actionBtnClass =
  'cursor-pointer transition-all duration-200 hover:border-[#d4af37] hover:bg-[#fffdf8] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]';

export default function DressDetailsModal({
  dress,
  onClose,
  initialImageIndex = 0,
  onReserve,
  onToggleCart,
  onToggleFavorite,
  onCoordinate,
  onRate,
  onShare,
  isInCart = false,
  isFavorite = false,
}: Props) {
  const [imageIndex, setImageIndex] = useState(initialImageIndex);
  const description = getCleanDescription(dress.description);
  const rows = getDressDetailRows(dress);
  const images = dress.images?.length ? dress.images : [];

  useEffect(() => {
    setImageIndex(initialImageIndex);
  }, [dress.id, initialImageIndex]);

  const goPrev = () => setImageIndex((prev) => stepImageIndex(prev, -1, images.length));
  const goNext = () => setImageIndex((prev) => stepImageIndex(prev, 1, images.length));

  return (
    <div
      className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-[#d4af37] max-h-[94vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 bg-white hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#ebd4a8] shadow-md font-bold transition-all cursor-pointer"
          aria-label="סגירה"
        >
          ✕
        </button>

        <div className="relative w-full md:w-3/5 shrink-0 flex flex-col bg-[#faf8f3] border-b md:border-b-0 md:border-l border-[#f0e2c3] md:min-h-[70vh]">
          <div className="relative w-full h-[min(50vh,26rem)] sm:h-[min(55vh,30rem)] md:h-auto md:flex-1 md:min-h-[55vh] overflow-hidden">
            {images.length > 0 ? (
              <>
                <DressImageFill
                  src={images[imageIndex]}
                  alt={dress.name}
                  className="absolute inset-0 h-full w-full"
                  fillMode="contain"
                />
                <span className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md pointer-events-none border border-[#c9a227]">
                  מידה {dress.size}
                </span>

                <DressImageSliderNav
                  imageCount={images.length}
                  currentIndex={imageIndex}
                  onPrev={goPrev}
                  onNext={goNext}
                  onSelect={setImageIndex}
                  variant="modal"
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl text-[#decfa8]">👗</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="shrink-0 flex gap-2 p-3 justify-center overflow-x-auto border-t border-[#f0e2c3] bg-white/70">
              {images.map((img, idx) => (
                <button
                  key={`thumb-${img}-${idx}`}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-[#faf8f3] cursor-pointer transition-all hover:scale-105 ${
                    idx === imageIndex ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40' : 'border-[#eadaaf] hover:border-[#d4af37]'
                  }`}
                >
                  <DressImageFill src={img} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-2/5 flex flex-col md:overflow-y-auto md:max-h-[70vh] bg-gradient-to-b from-[#fffdf9] to-[#faf6eb]">
          <div className="p-5 sm:p-6 space-y-4 flex-1">
            <div>
              <p className="text-[10px] text-[#b8860b] font-black tracking-widest mb-1">✦ פרטי שמלה ✦</p>
              <h2 className="text-xl sm:text-2xl font-black text-[#3d2f24] leading-tight">{dress.name}</h2>
            </div>

            {description && (
              <div className="bg-white border border-[#eadaaf] rounded-xl p-4">
                <p className="text-[10px] font-black text-[#8b6508] mb-1">תיאור</p>
                <p className="text-sm text-[#5c5037] leading-relaxed">{description}</p>
              </div>
            )}

            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-white border border-[#ede3c8]"
                >
                  <span className="text-xs text-[#8b6508] font-bold">{row.label}</span>
                  <span
                    className={`text-sm ${
                      row.value === DRESS_DETAIL_NOT_SPECIFIED
                        ? 'font-bold text-[#9a7b4f]'
                        : 'font-black text-[#3d2f24]'
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <DressRatingsSection dress={dress} />

            <div className="flex justify-between items-center pt-2 border-t-2 border-dotted border-[#eadaaf]">
              <span className="text-sm font-bold text-[#8b6508]">מחיר השכרה</span>
              <span className="text-3xl font-black text-[#3d2f24]">₪{dress.price}</span>
            </div>

            {dress.owner_name && (
              <p className="text-xs text-center text-[#6e634c]">
                משכירה: <strong className="text-[#8b6508]">{dress.owner_name}</strong>
              </p>
            )}
          </div>

          {(onReserve || onToggleCart || onToggleFavorite || onCoordinate || onRate || onShare) && (
            <div className="p-5 sm:p-6 pt-0 space-y-2 border-t border-[#f0e2c3] bg-white/60">
              {onReserve && (
                <button
                  type="button"
                  onClick={onReserve}
                  className={`w-full py-3.5 bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#d4af37] hover:to-[#b8860b] text-white text-sm font-black rounded-xl shadow-md ${actionBtnClass}`}
                >
                  שרייני עכשיו
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                {onToggleCart && (
                  <button
                    type="button"
                    onClick={onToggleCart}
                    className={`py-2.5 rounded-xl text-xs font-bold border ${actionBtnClass} ${
                      isInCart
                        ? 'bg-[#f4ebd4] border-[#d4af37] text-[#b8860b]'
                        : 'bg-white border-[#decfa8] text-[#8b6508]'
                    }`}
                  >
                    {isInCart ? '🛒 בסל' : '➕ לסל'}
                  </button>
                )}
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    className={`py-2.5 rounded-xl text-xs font-bold border border-[#decfa8] bg-white text-[#8b6508] ${actionBtnClass}`}
                  >
                    {isFavorite ? '❤️ במועדפים' : '🤍 הוסיפי למועדפים'}
                  </button>
                )}
              </div>
              {onCoordinate && (
                <button
                  type="button"
                  onClick={onCoordinate}
                  className={`w-full py-2.5 border-2 border-[#decfa8] bg-white text-[#8b6508] text-xs font-bold rounded-xl ${actionBtnClass}`}
                >
                  📅 תיאום עם המשכירה
                </button>
              )}
              {(onRate || onShare) && (
                <div className="grid grid-cols-2 gap-2">
                  {onRate && (
                    <button
                      type="button"
                      onClick={onRate}
                      className={`py-2.5 rounded-xl text-xs font-bold border border-[#decfa8] bg-white text-[#8b6508] ${actionBtnClass}`}
                    >
                      ⭐ דרגי
                    </button>
                  )}
                  {onShare && (
                    <button
                      type="button"
                      onClick={onShare}
                      className={`py-2.5 rounded-xl text-xs font-bold border border-[#decfa8] bg-white text-[#8b6508] ${actionBtnClass}`}
                    >
                      📤 שתפי
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
