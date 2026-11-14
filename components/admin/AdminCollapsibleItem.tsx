'use client';

import { useState, type ReactNode } from 'react';

type AdminCollapsibleItemProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function AdminCollapsibleItem({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: AdminCollapsibleItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#ead8dc] rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-2 p-3 text-right hover:bg-[#fffafb] transition-colors"
      >
        <span className="text-[10px] text-[#7a5e64] shrink-0 w-4">{open ? '▲' : '▼'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[#2c2426]">{title}</div>
          {subtitle && <div className="text-[10px] text-[#6e5e62] mt-0.5">{subtitle}</div>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </button>
      {open && <div className="p-3 border-t border-[#f0e8d0] bg-[#fffafb]">{children}</div>}
    </div>
  );
}
