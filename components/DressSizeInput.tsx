'use client';

import { useId } from 'react';
import { DRESS_SIZES } from '@/lib/constants';
import { DRESS_SIZE_DATALIST } from '@/lib/dress-size';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  showQuickPick?: boolean;
};

const defaultClass =
  'w-full p-2.5 bg-white border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] focus:outline-none focus:border-[#d4af37]';

export default function DressSizeInput({
  value,
  onChange,
  required = false,
  className = defaultClass,
  placeholder = 'הקלידי או בחרי מידה, למשל: S (36)',
  showQuickPick = true,
}: Props) {
  const listId = useId();

  return (
    <div className="space-y-2">
      <input
        type="text"
        required={required}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        inputMode="text"
        autoComplete="off"
      />
      <datalist id={listId}>
        {DRESS_SIZE_DATALIST.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {showQuickPick && (
        <div className="flex flex-wrap gap-1.5">
          {DRESS_SIZES.map((size) => {
            const selected = value.trim() === size.label;
            return (
              <button
                key={size.label}
                type="button"
                onClick={() => onChange(size.label)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  selected
                    ? 'bg-[#d4af37] text-white border-[#d4af37]'
                    : 'bg-white text-[#8b6508] border-[#decfa8] hover:bg-[#fffdf8] hover:border-[#d4af37]'
                }`}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
