'use client';

import type { ReactNode } from 'react';
import type { AdminBookingRow } from '@/lib/admin-types';

type AdminBookingGridCardProps = {
  booking: AdminBookingRow;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  line2: ReactNode;
  line3?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

export default function AdminBookingGridCard({
  isOpen,
  onToggle,
  title,
  line2,
  line3,
  badge,
  disabled,
  children,
}: AdminBookingGridCardProps) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-shadow bg-white ${
        isOpen ? 'border-[#6b2340] shadow-md' : 'border-[#ead8dc]'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full p-2 text-right hover:bg-[#fffafb] transition-colors"
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-[9px] text-[#7a5e64] shrink-0">{isOpen ? '▲' : '▼'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[11px] text-[#2c2426] line-clamp-2 leading-tight">{title}</p>
            <div className="text-[9px] text-[#6e5e62] mt-0.5 leading-snug">{line2}</div>
            {line3 && <p className="text-[9px] text-[#7a5e64] mt-0.5 truncate">{line3}</p>}
          </div>
          {badge}
        </div>
      </button>
      {isOpen && (
        <div className="px-2 pb-2 pt-0 border-t border-[#f0e8d0] bg-[#fffafb] space-y-1">{children}</div>
      )}
    </div>
  );
}
