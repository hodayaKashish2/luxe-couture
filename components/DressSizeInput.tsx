'use client';

import { DRESS_SIZE_GROUP_LABELS, DRESS_SIZE_GROUP_ORDER, DRESS_SIZES } from '@/lib/constants';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  showQuickPick?: boolean;
};

const defaultClass =
  'w-full p-2.5 bg-white border border-[#e3cfd3] rounded-xl text-xs text-[#2c261a] focus:outline-none focus:border-[#6b2340]';

const adultQuickPickSizes = DRESS_SIZES.filter((size) => size.group === 'adult');

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
        {DRESS_SIZE_GROUP_ORDER.map((groupId) => (
          <optgroup key={groupId} label={DRESS_SIZE_GROUP_LABELS[groupId]}>
            {DRESS_SIZES.filter((size) => size.group === groupId).map((size) => (
              <option key={size.label} value={size.label}>
                {size.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {showQuickPick && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#6b2340]">בחירה מהירה — מבוגרות</p>
          <div className="flex flex-wrap gap-1.5">
            {adultQuickPickSizes.map((size) => {
              const selected = value.trim() === size.label;
              return (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => onChange(size.label)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    selected
                      ? 'bg-[#6b2340] text-white border-[#6b2340]'
                      : 'bg-white text-[#6b2340] border-[#e3cfd3] hover:bg-[#fffafb] hover:border-[#6b2340]'
                  }`}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
