'use client';

type DressImageFillProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
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
  const motionClass = hoverScale
    ? 'transition-transform duration-700 ease-out group-hover:scale-105'
    : '';

  return (
    <div className={`relative overflow-hidden bg-[#f5f0e6] ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-50 blur-lg ${motionClass}`}
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`absolute inset-0 z-[1] h-full w-full object-contain object-center ${motionClass} ${imageClassName}`}
      />
    </div>
  );
}
