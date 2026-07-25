'use client';

import type { ReactNode } from 'react';
import DressImageFill from '@/components/DressImageFill';
import type { AdminDressRow } from '@/lib/admin-types';

type AdminDressGridCardProps = {
  dress: AdminDressRow;
  isOpen: boolean;
  onToggle: () => void;
  badge?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

export default function AdminDressGridCard({
  dress,
  isOpen,
  onToggle,
  badge,
  disabled,
  children,
}: AdminDressGridCardProps) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-shadow ${
        isOpen ? 'border-[#d4af37] shadow-md' : 'border-[#eadaaf]'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full p-2 text-right hover:bg-[#fffdf8] transition-colors"
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-[9px] text-[#9a7b4f] shrink-0">{isOpen ? '▲' : '▼'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[11px] text-[#3d2f24] line-clamp-2 leading-tight">
              {dress.name}
            </p>
            <p className="text-[10px] font-black text-[#8b6508] mt-0.5">₪{dress.price}</p>
            <p className="text-[9px] text-[#6e634c] mt-0.5 truncate" dir="ltr">
              {dress.owner_phone || '—'}
            </p>
          </div>
          {badge}
        </div>
      </button>
      {isOpen && (
        <div className="px-2 pb-2 pt-0 border-t border-[#f0e8d0] bg-[#fffdf8] space-y-1.5">
          {dress.images?.[0] && (
            <DressImageFill src={dress.images[0]} alt="" className="w-full h-20 rounded-lg mt-1.5" />
          )}
          {children}
        </div>
      )}
    </div>
  );
}
