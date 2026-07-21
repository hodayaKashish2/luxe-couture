'use client';

type DressImageFillProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** contain = כל השמלה נראית (ברירת מחדל). cover = חיתוך למילוי מלא */
  fillMode?: 'contain' | 'cover';
  hoverScale?: boolean;
  loading?: 'lazy' | 'eager';
};

export default function DressImageFill({
  src,
  alt,
  className = '',
  imageClassName = '',
  fillMode = 'contain',
  hoverScale = false,
  loading,
}: DressImageFillProps) {
  const isCover = fillMode === 'cover';
  const backdropMotion = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-110'
    : '';
  const mainHoverClass = hoverScale
    ? 'transition-transform duration-500 ease-out group-hover:scale-[1.02]'
    : '';
  const mainImageClass = isCover
    ? `absolute inset-0 z-[1] h-full w-full object-cover object-center ${imageClassName}`
    : `absolute inset-0 z-[1] h-full w-full object-contain object-center ${imageClassName}`;

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
        className={`${mainImageClass} ${mainHoverClass}`}
      />
    </div>
  );
}
