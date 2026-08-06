'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type FilterOptionGroup = {
  label: string;
  options: string[];
};

type MultiSelectFilterMenuProps = {
  title: string;
  selected: string[];
  onChange: (next: string[]) => void;
  options?: string[];
  groups?: FilterOptionGroup[];
  emptyHint?: string;
  allLabel?: string;
};

function toggleValue(selected: string[], value: string) {
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

function selectionSummary(title: string, selected: string[], allLabel: string) {
  if (!selected.length) return allLabel;
  if (selected.length === 1) return selected[0];
  return `${selected.length} נבחרו ב${title}`;
}

export default function MultiSelectFilterMenu({
  title,
  selected,
  onChange,
  options = [],
  groups = [],
  emptyHint,
  allLabel,
}: MultiSelectFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const flatOptions = groups.length ? groups.flatMap((group) => group.options) : options;
  const resolvedAllLabel = allLabel ?? `כל ${title}`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const renderOption = (option: string) => {
    const active = selected.includes(option);
    return (
      <button
        key={option}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => onChange(toggleValue(selected, option))}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-right rounded-lg transition-colors ${
          active ? 'bg-[#fff8e8] text-[#3d2f24]' : 'hover:bg-[#fffdf8] text-[#554a33]'
        }`}
      >
        <span className={`text-xs font-bold shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${
          active ? 'bg-[#d4af37] border-[#b8860b] text-white' : 'border-[#eadaaf] bg-white text-transparent'
        }`}>
          ✓
        </span>
        <span className="flex-1 text-xs font-medium leading-snug">{option}</span>
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
          open || selected.length
            ? 'border-[#d4af37] bg-[#fffdf8] text-[#3d2f24] shadow-sm'
            : 'border-[#dfc48c] bg-neutral-50 text-[#6e634c] hover:border-[#d4af37]'
        }`}
      >
        <span className="text-[#9a7b4f] text-[10px] shrink-0">{open ? '▲' : '▼'}</span>
        <span className="flex-1 truncate text-right">{selectionSummary(title, selected, resolvedAllLabel)}</span>
        {selected.length > 0 && (
          <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#d4af37] text-white text-[10px] font-black flex items-center justify-center">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={title}
          className="mt-1.5 w-full max-h-72 overflow-y-auto overscroll-auto rounded-xl border border-[#eadaaf] bg-white shadow-md p-1.5 pb-2"
        >
          {!flatOptions.length ? (
            emptyHint ? (
              <p className="px-3 py-4 text-[11px] text-[#9a7b4f] text-center leading-relaxed">{emptyHint}</p>
            ) : null
          ) : groups.length ? (
            groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="px-3 pt-2 pb-1 text-[10px] font-black text-[#8b6508] bg-[#fffdf8]">
                  {group.label}
                </p>
                <div className="space-y-0.5">{group.options.map(renderOption)}</div>
              </div>
            ))
          ) : (
            <div className="space-y-0.5">{options.map(renderOption)}</div>
          )}

          {flatOptions.length > 0 && (
            <div className="border-t border-[#f0e8d0] mt-1 pt-1 px-1">
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={selected.length === 0}
                className="w-full py-2 text-[11px] font-bold text-[#b8860b] rounded-lg hover:bg-[#fffdf8] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                נקה בחירה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
