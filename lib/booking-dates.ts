export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDate(date: string): boolean {
  if (!date) return false;
  return date < todayDateString();
}

/** מפריד הזמנות עתידיות/היום מול היסטוריה */
export function splitBookingsByEventDate<T extends { event_date: string }>(
  bookings: T[],
  today = todayDateString()
) {
  const upcoming = bookings
    .filter((b) => b.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = bookings
    .filter((b) => b.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));
  return { upcoming, past };
}
