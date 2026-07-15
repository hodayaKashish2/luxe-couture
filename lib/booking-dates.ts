export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDate(date: string): boolean {
  if (!date) return false;
  return date < todayDateString();
}
