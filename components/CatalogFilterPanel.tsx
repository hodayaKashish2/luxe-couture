'use client';

import FilterSection from '@/components/FilterSection';
import { EVENT_TYPES, type SortOption } from '@/lib/types';

export type CatalogFilterPanelProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  sizeFilter: string;
  setSizeFilter: (value: string) => void;
  selectedEventType: string;
  setSelectedEventType: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  colorFilter: string;
  setColorFilter: (value: string) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  showSort?: boolean;
  compact?: boolean;
};

const fieldClass =
  'w-full p-2 bg-neutral-50 border border-[#dfc48c] rounded-lg text-xs text-[#2c261a] focus:outline-none focus:border-[#d4af37]';

function sortHint(sortBy: SortOption) {
  if (sortBy === 'price-asc' || sortBy === 'price-desc') {
    return 'מיון לפי מחיר, ואז לפי מומלצות';
  }
  if (sortBy === 'newest') {
    return 'מיון לפי חדש ביותר, ואז לפי מומלצות';
  }
  return 'ברירת מחדל: מומלצות';
}

export default function CatalogFilterPanel({
  searchTerm,
  setSearchTerm,
  cityFilter,
  setCityFilter,
  sizeFilter,
  setSizeFilter,
  selectedEventType,
  setSelectedEventType,
  sortBy,
  setSortBy,
  colorFilter,
  setColorFilter,
  maxPrice,
  setMaxPrice,
  showSort = true,
  compact = false,
}: CatalogFilterPanelProps) {
  return (
    <div className={compact ? 'px-1' : ''}>
      <FilterSection title="חיפוש" defaultOpen>
        <input
          type="text"
          placeholder="שם שמלה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={fieldClass}
        />
      </FilterSection>

      <FilterSection title="עיר" defaultOpen={!!cityFilter}>
        <input
          type="text"
          placeholder="הקלידי עיר, למשל: ירושלים"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={fieldClass}
        />
      </FilterSection>

      <FilterSection title="מידה" defaultOpen={!!sizeFilter}>
        <input
          type="text"
          placeholder="הקלידי מידה, למשל: 38, M"
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
          className={fieldClass}
          inputMode="text"
        />
        <p className="text-[10px] text-[#9a7b4f] mt-1.5">ניתן להקליד מספר או אותיות (XS, M, 40...)</p>
      </FilterSection>

      <FilterSection title="סוג אירוע" defaultOpen={!!selectedEventType}>
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
      </FilterSection>

      <FilterSection title="צבע" defaultOpen={!!colorFilter}>
        <input
          type="text"
          placeholder="הקלידי צבע, למשל: לבן"
          value={colorFilter}
          onChange={(e) => setColorFilter(e.target.value)}
          className={fieldClass}
        />
      </FilterSection>

      {showSort && (
        <FilterSection title="מיון" defaultOpen={false}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={fieldClass}
          >
            <option value="recommended">מומלצות</option>
            <option value="newest">חדש ביותר</option>
            <option value="price-asc">מחיר: נמוך לגבוה</option>
            <option value="price-desc">מחיר: גבוה לנמוך</option>
          </select>
        </FilterSection>
      )}

      <FilterSection title="מחיר" defaultOpen={maxPrice < 2000}>
        <div className="flex justify-between text-[11px] font-bold text-[#8b6508] mb-2">
          <span>מקסימום</span>
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
      </FilterSection>

      <p className="text-[10px] text-[#9a7b4f] leading-relaxed py-3">{sortHint(sortBy)}</p>
    </div>
  );
}
