'use client';

type AdminImageLightboxProps = {
  src: string;
  label?: string;
  onClose: () => void;
};

export default function AdminImageLightbox({ src, label, onClose }: AdminImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 text-[#3d2f24] font-bold text-lg shadow-lg"
        aria-label="סגירה"
      >
        ✕
      </button>
      <div className="max-w-4xl w-full text-center" onClick={(e) => e.stopPropagation()}>
        {label && <p className="text-white text-sm font-bold mb-3">{label}</p>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="max-h-[85vh] max-w-full mx-auto rounded-xl border-4 border-white shadow-2xl object-contain bg-white"
        />
      </div>
    </div>
  );
}
