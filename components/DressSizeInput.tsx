'use client';

import { useId } from 'react';
import { DRESS_SIZE_DATALIST } from '@/lib/dress-size';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

const defaultClass =
  'w-full p-2.5 bg-white border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] focus:outline-none focus:border-[#d4af37]';

export default function DressSizeInput({
  value,
  onChange,
  required = false,
  className = defaultClass,
  placeholder = 'הקלידי מידה, למשל: 38, M, XL',
}: Props) {
  const listId = useId();

  return (
    <>
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
    </>
  );
}
