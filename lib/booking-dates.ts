export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDate(date: string): boolean {
  if (!date) return false;
  return date < todayDateString();
}

export function isUpcomingEventDate(eventDate: string, today = todayDateString()): boolean {
  if (!eventDate) return false;
  return eventDate >= today;
}

export function countUpcomingConfirmed<T extends { event_date: string; status: string }>(
  bookings: T[],
  today = todayDateString()
): number {
  return bookings.filter((b) => b.status === 'confirmed' && b.event_date >= today).length;
}

/** מפריד הזמנות עתידיות/היום מול היסטוריה (עד 30 יום אחורה) */
export function splitBookingsByEventDate<T extends { event_date: string }>(
  bookings: T[],
  today = todayDateString()
) {
  const cutoff = (() => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  })();

  const upcoming = bookings
    .filter((b) => b.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = bookings
    .filter((b) => b.event_date < today && b.event_date >= cutoff)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));
  return { upcoming, past };
}
