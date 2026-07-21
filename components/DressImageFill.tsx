'use client';

import { useEffect, useRef, useState } from 'react';

type DressImageFillProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** contain = כל השמלה נראית. cover = למילוי כרטיס (תמונות רחבות/מרובעות בלבד) */
  fillMode?: 'contain' | 'cover';
  hoverScale?: boolean;
  loading?: 'lazy' | 'eager';
};

type RenderMode = 'contain' | 'cover';

const DEFAULT_BOX_RATIO = 3 / 4;

function pickRenderMode(imageW: number, imageH: number, boxW: number, boxH: number): RenderMode {
  if (!imageW || !imageH) return 'contain';
  const boxRatio = boxW > 0 && boxH > 0 ? boxW / boxH : DEFAULT_BOX_RATIO;
  const imageRatio = imageW / imageH;
  return imageRatio > boxRatio ? 'cover' : 'contain';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode | null>(null);
  const srcKeyRef = useRef(src);

  const isForcedCover = fillMode === 'cover';
  const backdropMotion = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-110'
    : '';
  const mainHoverClass =
    hoverScale ? 'transition-transform duration-500 ease-out group-hover:scale-[1.02]' : '';

  useEffect(() => {
    srcKeyRef.current = src;
    setRenderMode(null);

    if (isForcedCover) {
      setRenderMode('cover');
      return;
    }

    let cancelled = false;
    const probe = new Image();

    const resolve = (naturalW: number, naturalH: number) => {
      if (cancelled || srcKeyRef.current !== src) return;
      const box = containerRef.current;
      const mode = pickRenderMode(
        naturalW,
        naturalH,
        box?.clientWidth || 0,
        box?.clientHeight || 0
      );
      setRenderMode(mode);
    };

    const tryResolve = (naturalW: number, naturalH: number) => {
      const box = containerRef.current;
      if (box && box.clientWidth > 0 && box.clientHeight > 0) {
        resolve(naturalW, naturalH);
        return;
      }
      requestAnimationFrame(() => {
        if (!cancelled) resolve(naturalW, naturalH);
      });
    };

    probe.onload = () => tryResolve(probe.naturalWidth, probe.naturalHeight);
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, isForcedCover]);

  const activeMode = isForcedCover ? 'cover' : renderMode;
  const mainImageClass =
    activeMode === 'cover'
      ? `absolute inset-0 z-[1] h-full w-full object-cover object-[center_38%] ${imageClassName}`
      : `absolute inset-0 z-[1] h-full w-full object-contain object-center ${imageClassName}`;

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-[#ebe4d6] ${className}`}>
      {!isForcedCover && (
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
      {activeMode && (
        <img
          key={`${src}-${activeMode}`}
          src={src}
          alt={alt}
          loading={loading}
          draggable={false}
          className={`${mainImageClass} ${mainHoverClass}`}
        />
      )}
    </div>
  );
}
