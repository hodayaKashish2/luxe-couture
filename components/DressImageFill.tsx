'use client';

import { useImageSubjectFocus } from '@/hooks/use-image-subject-focus';

type DressImageFillProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** contain = בתוך מסגרת קבועה. cover = חיתוך. natural = התמונה במלואה והמסגרת מתאימה אליה. smart = זיהוי דוגמנית + חיתוך אנכי */
  fillMode?: 'contain' | 'cover' | 'natural' | 'smart';
  hoverScale?: boolean;
  loading?: 'lazy' | 'eager';
};

function DressImageSmart({
  src,
  alt,
  className,
  imageClassName,
  hoverScale,
  loading,
}: Omit<DressImageFillProps, 'fillMode'>) {
  const focus = useImageSubjectFocus(src, Boolean(src));
  const backdropMotion = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-110'
    : '';
  const mainHoverClass = hoverScale
    ? 'transition-transform duration-500 ease-out group-hover:scale-[1.02]'
    : '';
  const fitClass = focus.useSideBlur ? 'object-contain' : 'object-cover';

  return (
    <div className={`relative overflow-hidden bg-[#ebe4d6] ${className ?? ''}`}>
      {focus.useSideBlur && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className={`absolute inset-0 h-full w-full scale-[1.35] object-cover opacity-[0.72] blur-2xl saturate-[1.15] ${backdropMotion}`}
            style={{ objectPosition: focus.objectPosition }}
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
        className={`absolute inset-0 z-[1] h-full w-full ${fitClass} ${imageClassName ?? ''} ${mainHoverClass}`}
        style={{ objectPosition: focus.objectPosition }}
      />
    </div>
  );
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
  if (fillMode === 'smart') {
    return (
      <DressImageSmart
        src={src}
        alt={alt}
        className={className}
        imageClassName={imageClassName}
        hoverScale={hoverScale}
        loading={loading}
      />
    );
  }

  const isCover = fillMode === 'cover';
  const isNatural = fillMode === 'natural';
  const backdropMotion = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-110'
    : '';
  const mainHoverClass = hoverScale
    ? 'transition-transform duration-500 ease-out group-hover:scale-[1.02]'
    : '';

  if (isNatural) {
    return (
      <div className={`relative w-full overflow-hidden bg-[#ebe4d6] ${className}`}>
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          className={`absolute inset-0 h-full w-full scale-[1.2] object-cover object-center opacity-[0.65] blur-2xl saturate-[1.1] ${backdropMotion}`}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#f8f4eb]/15 via-transparent to-[#ebe4d6]/25"
        />
        <img
          src={src}
          alt={alt}
          loading={loading}
          draggable={false}
          className={`relative z-[1] block w-full h-auto ${imageClassName} ${mainHoverClass}`}
        />
      </div>
    );
  }

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
