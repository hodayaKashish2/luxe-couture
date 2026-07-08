'use client';

import { useMemo } from 'react';

type Props = {
  bookedDates?: string[];
  days?: number;
  compact?: boolean;
};

export default function DressCalendar({ bookedDates = [], days = 28, compact = false }: Props) {
  const bookedSet = useMemo(() => new Set(bookedDates), [bookedDates]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: { date: string; label: string; booked: boolean }[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      result.push({
        date: iso,
        label: d.toLocaleDateString('he-IL', {
          weekday: compact ? 'narrow' : 'short',
          day: 'numeric',
          month: 'short',
        }),
        booked: bookedSet.has(iso),
      });
    }
    return result;
  }, [bookedSet, days, compact]);

  return (
    <div className={`grid gap-1.5 ${compact ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'}`}>
      {calendarDays.map((day) => (
        <div
          key={day.date}
          className={`rounded-lg border text-center ${compact ? 'p-1.5 text-[9px]' : 'p-2 text-[10px]'} ${
            day.booked ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-[#eadaaf] text-[#6e634c]'
          }`}
          title={day.date}
        >
          <p className="font-bold text-[#8b6508] leading-tight">{day.label}</p>
          <p className="mt-0.5">{day.booked ? '🔒' : '✓'}</p>
        </div>
      ))}
    </div>
  );
}
