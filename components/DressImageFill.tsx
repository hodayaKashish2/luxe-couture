'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

type LayoutMode = 'wide' | 'tall';

/** השוואה ליחס הקונטיינר — לא ל-1:1. תמונה רחבה/מרובעת ממלאה גובה → רקע מהצדדים */
function pickLayoutMode(imageW: number, imageH: number, boxW: number, boxH: number): LayoutMode {
  if (!imageW || !imageH || !boxW || !boxH) return 'tall';
  const imageRatio = imageW / imageH;
  const boxRatio = boxW / boxH;
  return imageRatio > boxRatio ? 'wide' : 'tall';
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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tall');
  const naturalSizeRef = useRef({ w: 0, h: 0 });

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

  const applyLayout = useCallback((naturalW: number, naturalH: number) => {
    naturalSizeRef.current = { w: naturalW, h: naturalH };
    const box = containerRef.current;
    if (!box) return;
    setLayoutMode(pickLayoutMode(naturalW, naturalH, box.clientWidth, box.clientHeight));
  }, []);

  useEffect(() => {
    naturalSizeRef.current = { w: 0, h: 0 };
    setLayoutMode('tall');

    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) applyLayout(probe.naturalWidth, probe.naturalHeight);
    };
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, applyLayout]);

  useEffect(() => {
    const box = containerRef.current;
    if (!box) return;

    const observer = new ResizeObserver(() => {
      const { w, h } = naturalSizeRef.current;
      if (w && h) applyLayout(w, h);
    });

    observer.observe(box);
    return () => observer.disconnect();
  }, [applyLayout]);

  const portraitMainClass = `absolute inset-0 z-[1] h-full w-full object-contain object-center ${imageClassName}`;
  const wideMainClass = `absolute top-0 left-1/2 z-[1] h-full w-auto max-w-none -translate-x-1/2 ${imageClassName}`;
  const mainImageClass = isCover
    ? `absolute inset-0 z-[1] h-full w-full object-cover object-center ${imageClassName}`
    : layoutMode === 'wide'
      ? wideMainClass
      : portraitMainClass;

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-[#ebe4d6] ${className}`}>
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
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) {
            applyLayout(el.naturalWidth, el.naturalHeight);
          }
        }}
        onLoad={(e) => {
          const img = e.currentTarget;
          applyLayout(img.naturalWidth, img.naturalHeight);
        }}
        className={`${mainImageClass} ${mainHoverClass}`}
      />
    </div>
  );
}
