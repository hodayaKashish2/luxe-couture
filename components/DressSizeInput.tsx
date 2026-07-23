'use client';

import { DRESS_SIZES } from '@/lib/constants';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  showQuickPick?: boolean;
};

const defaultClass =
  'w-full p-2.5 bg-white border border-[#decfa8] rounded-xl text-xs text-[#2c261a] focus:outline-none focus:border-[#d4af37]';

export default function DressSizeInput({
  value,
  onChange,
  required = false,
  className = defaultClass,
  placeholder = 'בחרי מידה',
  showQuickPick = true,
}: Props) {
  return (
    <div className="space-y-2">
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">{placeholder}</option>
        {DRESS_SIZES.map((size) => (
          <option key={size.label} value={size.label}>
            {size.label}
          </option>
        ))}
      </select>
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
