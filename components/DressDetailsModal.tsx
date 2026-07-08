'use client';

import type { Dress } from '@/lib/types';
import { getCleanDescription, getDressDetailRows } from '@/lib/dress-display';

type Props = {
  dress: Dress;
  onClose: () => void;
};

export default function DressDetailsModal({ dress, onClose }: Props) {
  const description = getCleanDescription(dress.description);
  const rows = getDressDetailRows(dress);

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-[#d4af37] max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-l from-[#d4af37] to-[#b8860b] px-5 py-4 flex justify-between items-center rounded-t-2xl sm:rounded-t-2xl">
          <div>
            <p className="text-[10px] text-white/80 font-bold">פרטי שמלה</p>
            <h3 className="text-lg font-black text-white">{dress.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#8b6508] font-bold transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {dress.images?.[0] && (
            <div className="relative h-24 overflow-hidden rounded-xl border border-[#eadaaf]">
              <img
                src={dress.images[0]}
                alt={dress.name}
                className="w-full h-48 object-cover object-top"
              />
            </div>
          )}

          {description && (
            <div className="bg-[#fffdf8] border border-[#eadaaf] rounded-xl p-4">
              <p className="text-[10px] font-black text-[#8b6508] mb-1">תיאור</p>
              <p className="text-sm text-[#5c5037] leading-relaxed">{description}</p>
            </div>
          )}

          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-[#faf8f3] border border-[#ede3c8]"
              >
                <span className="text-xs text-[#8b6508] font-bold">{row.label}</span>
                <span className="text-sm font-black text-[#3d2f24]">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t-2 border-dotted border-[#eadaaf]">
            <span className="text-sm font-bold text-[#8b6508]">מחיר השכרה</span>
            <span className="text-2xl font-black text-[#3d2f24]">₪{dress.price}</span>
          </div>

          {dress.owner_name && (
            <p className="text-xs text-center text-[#6e634c]">
              משכירה: <strong className="text-[#8b6508]">{dress.owner_name}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
