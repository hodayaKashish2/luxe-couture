'use client';

import { useState } from 'react';
import FilterSection from '@/components/FilterSection';
import { DRESS_SIZES } from '@/lib/constants';
import { EVENT_TYPES, type SortOption } from '@/lib/types';

export type CatalogFilterPanelProps = {
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
  showSort?: boolean;
  compact?: boolean;
};

const fieldClass =
  'w-full p-2 bg-neutral-50 border border-[#dfc48c] rounded-lg text-xs text-[#2c261a] focus:outline-none focus:border-[#d4af37]';

const CITY_PREVIEW = 6;

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
  showSort = true,
  compact = false,
}: CatalogFilterPanelProps) {
  const [showAllCities, setShowAllCities] = useState(false);
  const visibleCities = showAllCities ? uniqueCities : uniqueCities.slice(0, CITY_PREVIEW);

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

      <FilterSection title="עיר" defaultOpen={!!selectedCity}>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
          <label className="flex items-center gap-2 text-xs text-[#5c5037] cursor-pointer py-0.5">
            <input
              type="radio"
              name="filter-city"
              checked={!selectedCity}
              onChange={() => setSelectedCity('')}
              className="accent-[#d4af37]"
            />
            כל הערים
          </label>
          {visibleCities.map((city) => (
            <label key={city} className="flex items-center gap-2 text-xs text-[#5c5037] cursor-pointer py-0.5">
              <input
                type="radio"
                name="filter-city"
                checked={selectedCity === city}
                onChange={() => setSelectedCity(city)}
                className="accent-[#d4af37]"
              />
              {city}
            </label>
          ))}
        </div>
        {uniqueCities.length > CITY_PREVIEW && (
          <button
            type="button"
            onClick={() => setShowAllCities((v) => !v)}
            className="mt-2 text-[11px] font-bold text-[#b8860b] hover:underline"
          >
            {showAllCities ? 'הצג פחות' : `+ הצג עוד (${uniqueCities.length - CITY_PREVIEW})`}
          </button>
        )}
      </FilterSection>

      <FilterSection title="מידה" defaultOpen={selectedSize !== 'All'}>
        <div className="grid grid-cols-2 gap-1.5">
          {DRESS_SIZES.map((size) => {
            const checked = selectedSize === size.value;
            return (
              <label
                key={size.value}
                className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-[#d4af37] bg-[#fffdf8] text-[#8b6508] font-bold'
                    : 'border-[#f0e6cc] text-[#5c5037] hover:border-[#decfa8]'
                }`}
              >
                <input
                  type="radio"
                  name="filter-size"
                  checked={checked}
                  onChange={() => setSelectedSize(size.value)}
                  className="accent-[#d4af37] shrink-0"
                />
                <span className="truncate">{size.label}</span>
              </label>
            );
          })}
          <label
            className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              selectedSize === 'All'
                ? 'border-[#d4af37] bg-[#fffdf8] text-[#8b6508] font-bold'
                : 'border-[#f0e6cc] text-[#5c5037] hover:border-[#decfa8]'
            }`}
          >
            <input
              type="radio"
              name="filter-size"
              checked={selectedSize === 'All'}
              onChange={() => setSelectedSize('All')}
              className="accent-[#d4af37] shrink-0"
            />
            הכל
          </label>
        </div>
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

      <FilterSection title="צבע" defaultOpen={!!selectedColor}>
        <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className={fieldClass}>
          <option value="">הכל</option>
          {uniqueColors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FilterSection>

      {showSort && (
        <FilterSection title="מיון" defaultOpen={false}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={fieldClass}
          >
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

      <p className="text-[10px] text-[#9a7b4f] leading-relaxed py-3">תמיד מוצג קודם לפי הכי מושכרות</p>
    </div>
  );
}
