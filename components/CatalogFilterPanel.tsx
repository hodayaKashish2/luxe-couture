'use client';

import { DRESS_SIZES } from '@/lib/constants';
import { EVENT_TYPES, type SortOption } from '@/lib/types';

type CatalogFilterPanelProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  selectedSize: string;
  setSelectedSize: (value: string) => void;
  selectedEventType: string;
  setSelectedEventType: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  uniqueCities: string[];
  uniqueColors: string[];
  onApply?: () => void;
  showApplyButton?: boolean;
};

const fieldClass =
  'w-full p-2.5 bg-neutral-50 border border-[#dfc48c] rounded-xl text-xs text-[#2c261a] focus:outline-none focus:border-[#d4af37]';

export default function CatalogFilterPanel({
  searchTerm,
  setSearchTerm,
  selectedCity,
  setSelectedCity,
  selectedSize,
  setSelectedSize,
  selectedEventType,
  setSelectedEventType,
  sortBy,
  setSortBy,
  selectedColor,
  setSelectedColor,
  maxPrice,
  setMaxPrice,
  uniqueCities,
  uniqueColors,
  onApply,
  showApplyButton,
}: CatalogFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-black text-[#8b6508] mb-1.5">חיפוש</label>
        <input
          type="text"
          placeholder="שם שמלה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label className="block text-xs font-black text-[#8b6508] mb-1.5">עיר</label>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className={fieldClass}>
          <option value="">כל הערים</option>
          {uniqueCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-black text-[#8b6508] mb-1.5">מידה</label>
        <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className={fieldClass}>
          <option value="All">הכל</option>
          {DRESS_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-black text-[#8b6508] mb-1.5">סוג אירוע</label>
        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value)}
          className={fieldClass}
        >
          <option value="">הכל</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-black text-[#8b6508] mb-1.5">צבע</label>
        <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className={fieldClass}>
          <option value="">הכל</option>
          {uniqueColors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-black text-[#8b6508] mb-1.5">מיון</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className={fieldClass}
        >
          <option value="newest">חדש ביותר</option>
          <option value="price-asc">מחיר: נמוך לגבוה</option>
          <option value="price-desc">מחיר: גבוה לנמוך</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between text-xs font-black text-[#8b6508] mb-1.5">
          <span>מחיר מקסימלי</span>
          <span>₪{maxPrice}</span>
        </div>
        <input
          type="range"
          min="100"
          max="2000"
          step="50"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#d4af37]"
        />
      </div>

      <p className="text-[10px] text-[#9a7b4f] leading-relaxed">תמיד מוצג קודם לפי הכי מושכרות</p>

      {showApplyButton && onApply && (
        <button
          type="button"
          onClick={onApply}
          className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black"
        >
          הצג תוצאות
        </button>
      )}
    </div>
  );
}
