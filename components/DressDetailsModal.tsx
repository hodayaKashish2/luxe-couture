'use client';

import { useState } from 'react';
import type { Dress } from '@/lib/types';
import { getCleanDescription, getDressDetailRows } from '@/lib/dress-display';

type Props = {
  dress: Dress;
  onClose: () => void;
  initialImageIndex?: number;
  onReserve?: () => void;
  onToggleCart?: () => void;
  onToggleFavorite?: () => void;
  onCoordinate?: () => void;
  isInCart?: boolean;
  isFavorite?: boolean;
};

export default function DressDetailsModal({
  dress,
  onClose,
  initialImageIndex = 0,
  onReserve,
  onToggleCart,
  onToggleFavorite,
  onCoordinate,
  isInCart = false,
  isFavorite = false,
}: Props) {
  const [imageIndex, setImageIndex] = useState(initialImageIndex);
  const description = getCleanDescription(dress.description);
  const rows = getDressDetailRows(dress);
  const images = dress.images?.length ? dress.images : [];

  return (
    <div
      className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-[#d4af37] max-h-[94vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-30 bg-white hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#ebd4a8] shadow-md font-bold transition-all"
          aria-label="סגירה"
        >
          ✕
        </button>

        {/* גלריה גדולה — גודל אחיד עם או בלי סליידר */}
        <div className="relative w-full md:w-3/5 flex flex-col bg-[#faf8f3] border-b md:border-b-0 md:border-l border-[#f0e2c3] min-h-[50vh] md:min-h-[70vh]">
          <div className="relative flex-1 min-h-[42vh] sm:min-h-[48vh] md:min-h-0">
            {images.length > 0 ? (
              <>
                <img
                  src={images[imageIndex]}
                  alt={dress.name}
                  className="absolute inset-0 w-full h-full object-contain p-3 sm:p-4"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-xl hover:bg-[#d4af37] hover:text-white transition-all"
                      aria-label="תמונה קודמת"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageIndex((prev) => (prev + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-xl hover:bg-[#d4af37] hover:text-white transition-all"
                      aria-label="תמונה הבאה"
                    >
                      ›
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/95 px-3 py-1.5 rounded-full shadow-md border border-[#e0cba0]">
                      {images.map((img, idx) => (
                        <button
                          key={`${img}-${idx}`}
                          type="button"
                          onClick={() => setImageIndex(idx)}
                          className={`rounded-full transition-all ${
                            idx === imageIndex ? 'bg-[#d4af37] w-3 h-3' : 'bg-[#e5d9bd] w-2 h-2 hover:bg-[#d4af37]/60'
                          }`}
                          aria-label={`תמונה ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
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
                  className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-[#faf8f3] ${
                    idx === imageIndex ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40' : 'border-[#eadaaf]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* פרטים */}
        <div className="w-full md:w-2/5 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[70vh] bg-gradient-to-b from-[#fffdf9] to-[#faf6eb]">
          <div className="p-5 sm:p-6 space-y-4 flex-1">
            <div>
              <p className="text-[10px] text-[#b8860b] font-black tracking-widest mb-1">✦ פרטי שמלה ✦</p>
              <h2 className="text-xl sm:text-2xl font-black text-[#3d2f24] leading-tight">{dress.name}</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-[10px] font-black px-3 py-1 rounded-full">
                  מידה {dress.size}
                </span>
                {dress.city && (
                  <span className="bg-[#f4ebd4] text-[#8b6508] text-[10px] font-bold px-3 py-1 rounded-full">
                    📍 {dress.city}
                  </span>
                )}
                {dress.event_type && (
                  <span className="bg-neutral-100 text-[#6e634c] text-[10px] px-3 py-1 rounded-full">
                    {dress.event_type}
                  </span>
                )}
              </div>
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
                  <span className="text-sm font-black text-[#3d2f24]">{row.value}</span>
                </div>
              ))}
            </div>

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

          {(onReserve || onToggleCart || onToggleFavorite || onCoordinate) && (
            <div className="p-5 sm:p-6 pt-0 space-y-2 border-t border-[#f0e2c3] bg-white/60">
              {onReserve && (
                <button
                  type="button"
                  onClick={onReserve}
                  className="w-full py-3.5 bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#d4af37] hover:to-[#b8860b] text-white text-sm font-black rounded-xl shadow-md transition-all"
                >
                  שרייני עכשיו
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                {onToggleCart && (
                  <button
                    type="button"
                    onClick={onToggleCart}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
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
                    className="py-2.5 rounded-xl text-xs font-bold border border-[#decfa8] bg-white text-[#8b6508]"
                  >
                    {isFavorite ? '❤️ במועדפים' : '🤍 הוסיפי למועדפים'}
                  </button>
                )}
              </div>
              {onCoordinate && (
                <button
                  type="button"
                  onClick={onCoordinate}
                  className="w-full py-2.5 border-2 border-[#decfa8] bg-white text-[#8b6508] text-xs font-bold rounded-xl"
                >
                  📅 תיאום עם המשכירה
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
