'use client';

import { useEffect, useState } from 'react';

type DressImageFillProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** contain = כל השמלה נראית (ברירת מחדל). cover = חיתוך למילוי מלא */
  fillMode?: 'contain' | 'cover';
  /** אפקט hover עדין — רק ברקע, כדי שלא ייחתך השמלה */
  hoverScale?: boolean;
  loading?: 'lazy' | 'eager';
};

/** תמונות מרובעות/רחבות — ממלאות גובה כדי שהרקע ייראה מהצדדים כמו בשמלות לאורך */
function detectImageFit(width: number, height: number) {
  if (!width || !height) return 'portrait' as const;
  return width / height >= 0.92 ? ('square' as const) : ('portrait' as const);
}

export default function DressImageFill({
  src,
  alt,
  className = '',
  imageClassName = '',
  fillMode = 'contain',
  hoverScale = false,
  loading,
}: DressImageFillProps) {
  const [imageFit, setImageFit] = useState<'portrait' | 'square'>('portrait');
  const backdropMotion = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-110'
    : '';
  const isCover = fillMode === 'cover';
  const mainHoverClass =
    hoverScale && isCover
      ? 'transition-transform duration-500 ease-out group-hover:scale-[1.03]'
      : hoverScale
        ? 'transition-transform duration-500 ease-out group-hover:scale-[1.02]'
        : '';

  useEffect(() => {
    setImageFit('portrait');
  }, [src]);

  const portraitMainClass = `absolute inset-0 z-[1] m-auto h-full w-full object-contain object-center ${imageClassName}`;
  const squareMainClass = `absolute top-0 left-1/2 z-[1] h-full w-auto max-w-none -translate-x-1/2 object-contain object-center ${imageClassName}`;
  const mainImageClass = isCover
    ? `absolute inset-0 z-[1] h-full w-full object-cover object-center ${imageClassName}`
    : imageFit === 'square'
      ? squareMainClass
      : portraitMainClass;

  return (
    <div className={`relative overflow-hidden bg-[#ebe4d6] ${className}`}>
      {!isCover && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className={`absolute inset-0 h-full w-full scale-[1.35] object-cover object-center opacity-[0.72] blur-2xl saturate-[1.15] ${backdropMotion}`}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[#f8f4eb]/20 via-transparent to-[#ebe4d6]/30"
          />
        </>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          setImageFit(detectImageFit(img.naturalWidth, img.naturalHeight));
        }}
        className={`${mainImageClass} ${mainHoverClass}`}
      />
    </div>
  );
}
