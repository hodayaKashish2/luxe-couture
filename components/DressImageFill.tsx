'use client';

type DressImageFillProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** אפקט hover עדין — רק ברקע, כדי שלא ייחתך השמלה */
  hoverScale?: boolean;
  loading?: 'lazy' | 'eager';
};

export default function DressImageFill({
  src,
  alt,
  className = '',
  imageClassName = '',
  hoverScale = false,
  loading,
}: DressImageFillProps) {
  const backdropMotion = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-110'
    : '';

  return (
    <div className={`relative overflow-hidden bg-[#ebe4d6] ${className}`}>
      {/* שכבת מילוי — אותה תמונה מטושטשת, ממלאה את כל השטח */}
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
      {/* שכבה ראשית — כל השמלה נראית, בלי חיתוך */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={false}
        className={`absolute inset-0 z-[1] h-full w-full max-h-full max-w-full object-contain object-center ${imageClassName}`}
      />
    </div>
  );
}
