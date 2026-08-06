'use client';

import FilterSection from '@/components/FilterSection';
import { DRESS_SIZES } from '@/lib/constants';
import { EVENT_TYPES, type SortOption } from '@/lib/types';

export type CatalogFilterPanelProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  cityFilters: string[];
  setCityFilters: (value: string[]) => void;
  availableCities: string[];
  sizeFilters: string[];
  setSizeFilters: (value: string[]) => void;
  selectedEventTypes: string[];
  setSelectedEventTypes: (value: string[]) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  colorFilters: string[];
  setColorFilters: (value: string[]) => void;
  availableColors: string[];
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  showSort?: boolean;
  compact?: boolean;
};

const fieldClass =
  'w-full p-2 bg-neutral-50 border border-[#dfc48c] rounded-lg text-xs text-[#2c261a] focus:outline-none focus:border-[#d4af37]';

function toggleValue(selected: string[], value: string) {
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

function MultiSelectChips({
  options,
  selected,
  onChange,
  emptyHint,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyHint?: string;
}) {
  if (!options.length) {
    return emptyHint ? <p className="text-[10px] text-[#9a7b4f] leading-relaxed">{emptyHint}</p> : null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto overscroll-contain">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(toggleValue(selected, option))}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
              active
                ? 'bg-[#d4af37] text-white border-[#b8860b] shadow-sm'
                : 'bg-neutral-50 text-[#6e634c] border-[#dfc48c] hover:border-[#d4af37]'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

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
  cityFilters,
  setCityFilters,
  availableCities,
  sizeFilters,
  setSizeFilters,
  selectedEventTypes,
  setSelectedEventTypes,
  sortBy,
  setSortBy,
  colorFilters,
  setColorFilters,
  availableColors,
  maxPrice,
  setMaxPrice,
  showSort = true,
  compact = false,
}: CatalogFilterPanelProps) {
  const multiHint = 'אפשר לבחור כמה אפשרויות';

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

      <FilterSection title="עיר" defaultOpen={cityFilters.length > 0}>
        <p className="text-[10px] text-[#9a7b4f] mb-2">{multiHint}</p>
        <MultiSelectChips
          options={availableCities}
          selected={cityFilters}
          onChange={setCityFilters}
          emptyHint="אין ערים בקטלוג עדיין"
        />
      </FilterSection>

      <FilterSection title="מידה" defaultOpen={sizeFilters.length > 0}>
        <p className="text-[10px] text-[#9a7b4f] mb-2">{multiHint}</p>
        <MultiSelectChips
          options={DRESS_SIZES.map((size) => size.label)}
          selected={sizeFilters}
          onChange={setSizeFilters}
        />
      </FilterSection>

      <FilterSection title="סוג אירוע" defaultOpen={selectedEventTypes.length > 0}>
        <p className="text-[10px] text-[#9a7b4f] mb-2">{multiHint}</p>
        <MultiSelectChips
          options={[...EVENT_TYPES]}
          selected={selectedEventTypes}
          onChange={setSelectedEventTypes}
        />
      </FilterSection>

      <FilterSection title="צבע" defaultOpen={colorFilters.length > 0}>
        <p className="text-[10px] text-[#9a7b4f] mb-2">{multiHint}</p>
        <MultiSelectChips
          options={availableColors}
          selected={colorFilters}
          onChange={setColorFilters}
          emptyHint="אין צבעים בקטלוג עדיין"
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
