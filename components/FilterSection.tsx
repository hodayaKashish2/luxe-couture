'use client';

import { useState, type ReactNode } from 'react';

type FilterSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#ead8dc] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 py-3 text-right hover:bg-[#fffafb] transition-colors"
      >
        <span className="text-xs font-black text-[#2c2426]">{title}</span>
        <span className="text-[#7a5e64] text-sm font-bold w-5 text-center shrink-0" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}
