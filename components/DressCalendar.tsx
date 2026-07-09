'use client';

import { useMemo, useState } from 'react';

type Props = {
  bookedDates?: string[];
  compact?: boolean;
};

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

type CalendarCell = {
  date: string;
  day: number;
  booked: boolean;
  isToday: boolean;
  outside: boolean;
};

function toIsoLocal(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayIsoLocal() {
  const now = new Date();
  return toIsoLocal(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function DressCalendar({ bookedDates = [], compact = false }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const bookedSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const todayIso = todayIsoLocal();

  const { cells, monthLabel, isCurrentMonth } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const monthLabel = firstDay.toLocaleDateString('he-IL', {
      month: 'long',
      year: 'numeric',
    });

    const cells: CalendarCell[] = [];

    const prevMonthDate = new Date(viewYear, viewMonth, 0);
    const prevMonthDays = prevMonthDate.getDate();
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const iso = toIsoLocal(prevYear, prevMonth, day);
      cells.push({
        date: iso,
        day,
        booked: bookedSet.has(iso),
        isToday: iso === todayIso,
        outside: true,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toIsoLocal(viewYear, viewMonth, d);
      cells.push({
        date: iso,
        day: d,
        booked: bookedSet.has(iso),
        isToday: iso === todayIso,
        outside: false,
      });
    }

    const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);
    const nextMonth = nextMonthDate.getMonth();
    const nextYear = nextMonthDate.getFullYear();
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      const iso = toIsoLocal(nextYear, nextMonth, nextDay);
      cells.push({
        date: iso,
        day: nextDay,
        booked: bookedSet.has(iso),
        isToday: iso === todayIso,
        outside: true,
      });
      nextDay += 1;
    }

    return {
      cells,
      monthLabel,
      isCurrentMonth: viewYear === now.getFullYear() && viewMonth === now.getMonth(),
    };
  }, [viewYear, viewMonth, bookedSet, todayIso, now]);

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  const cellClass = compact ? 'p-1 min-h-[2.25rem] text-[9px]' : 'p-1.5 min-h-[2.75rem] text-[10px]';

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#decfa8] bg-white text-[#8b6508] text-[10px] font-bold hover:border-[#d4af37] hover:bg-[#fffdf8] transition-colors"
          aria-label="חודש קודם"
        >
          ‹ חודש קודם
        </button>

        <div className="text-center flex-1 min-w-[8rem]">
          <p className="text-xs sm:text-sm font-black text-[#3d2f24] capitalize">{monthLabel}</p>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={goToday}
              className="text-[9px] text-[#b8860b] font-bold hover:underline mt-0.5"
            >
              חזרה לחודש הנוכחי
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => goMonth(1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#decfa8] bg-white text-[#8b6508] text-[10px] font-bold hover:border-[#d4af37] hover:bg-[#fffdf8] transition-colors"
          aria-label="חודש הבא"
        >
          חודש הבא ›
        </button>
      </div>

      <div className={`grid grid-cols-7 gap-1 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
        {WEEKDAYS.map((name) => (
          <div key={name} className="text-center font-black text-[#9a7b4f] py-1">
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={`rounded-lg border text-center flex flex-col items-center justify-center ${cellClass} ${
              cell.outside
                ? cell.booked
                  ? 'bg-red-50/50 border-red-100 text-red-400/80 opacity-70'
                  : 'bg-[#faf8f3] border-[#efe6cf] text-[#b5a88a] opacity-80'
                : cell.booked
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-white border-[#eadaaf] text-[#6e634c]'
            } ${cell.isToday ? 'ring-2 ring-[#d4af37] ring-offset-1' : ''}`}
            title={cell.date}
          >
            <span className={`font-bold leading-none ${cell.outside ? 'text-[#b5a88a]' : 'text-[#8b6508]'}`}>
              {cell.day}
            </span>
            <span className="mt-0.5 leading-none">{cell.booked ? '🔒' : cell.outside ? '·' : '✓'}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-[9px] text-[#9a7b4f] justify-center">
        <span>✓ פנוי</span>
        <span>🔒 שרוי</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full ring-2 ring-[#d4af37]" /> היום
        </span>
      </div>
    </div>
  );
}
