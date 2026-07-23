'use client';

type DressImageSliderNavProps = {
  imageCount: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  /** compact = כרטיס קטלוג, modal = פרטי שמלה */
  variant?: 'compact' | 'modal';
};

const navBtnClass =
  'absolute top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full border font-black shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer';

export default function DressImageSliderNav({
  imageCount,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
  variant = 'compact',
}: DressImageSliderNavProps) {
  if (imageCount <= 1) return null;

  const isModal = variant === 'modal';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPrev();
        }}
        className={`${navBtnClass} ${
          isModal
            ? 'left-2 sm:left-3 w-9 h-9 sm:w-10 sm:h-10 text-xl bg-white/95 text-[#b8860b] border-[#e8cc92] hover:bg-[#d4af37] hover:text-white'
            : 'left-1.5 sm:left-2 w-7 h-7 sm:w-8 sm:h-8 text-base bg-white/95 text-[#b8860b] border-[#e8cc92] hover:bg-[#fffdf8]'
        }`}
        aria-label="תמונה קודמת"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNext();
        }}
        className={`${navBtnClass} ${
          isModal
            ? 'right-2 sm:right-3 w-9 h-9 sm:w-10 sm:h-10 text-xl bg-white/95 text-[#b8860b] border-[#e8cc92] hover:bg-[#d4af37] hover:text-white'
            : 'right-1.5 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 text-base bg-white/95 text-[#b8860b] border-[#e8cc92] hover:bg-[#fffdf8]'
        }`}
        aria-label="תמונה הבאה"
      >
        ›
      </button>

      <div
        className={`absolute left-1/2 -translate-x-1/2 z-50 flex gap-1.5 ${
          isModal
            ? 'bottom-3 bg-white/95 px-3 py-1.5 rounded-full shadow-md border border-[#e0cba0] gap-2'
            : 'bottom-2 bg-black/35 px-1.5 py-0.5 rounded-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {Array.from({ length: imageCount }, (_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(idx);
            }}
            className={`rounded-full transition-all cursor-pointer ${
              isModal
                ? idx === currentIndex
                  ? 'bg-[#d4af37] w-3 h-3'
                  : 'bg-[#e5d9bd] w-2 h-2 hover:bg-[#d4af37]/60'
                : idx === currentIndex
                  ? 'bg-white w-2.5 h-1'
                  : 'bg-white/50 w-1 h-1 hover:bg-white/80'
            }`}
            aria-label={`תמונה ${idx + 1}`}
          />
        ))}
      </div>
    </>
  );
}

export function stepImageIndex(current: number | undefined, delta: number, count: number) {
  const safeCurrent = current ?? 0;
  return (safeCurrent + delta + count) % count;
}
