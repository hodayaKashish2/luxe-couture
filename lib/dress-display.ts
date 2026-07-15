import type { Dress } from '@/lib/types';

export function getConditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  if (condition === 'used') return 'יד שנייה';
  return condition || '';
}

/** מסיר מטא-דאטה שכבר מוצגת בשדות נפרדים */
export function getCleanDescription(description: string) {
  return description
    .split('|')
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        part !== 'אין תיאור זמין.' &&
        !part.startsWith('צבע:') &&
        !part.startsWith('מצב:') &&
        !part.toLowerCase().startsWith('contact_email:') &&
        !part.includes('ניקוי יבש')
    )
    .join(' · ');
}

export function getDressDetailRows(dress: Dress) {
  return [
    { label: 'עיר', value: dress.city },
    { label: 'סוג אירוע', value: dress.event_type },
    { label: 'צבע', value: dress.color },
    { label: 'מצב', value: getConditionLabel(dress.condition) },
    dress.deposit > 0 ? { label: 'פיקדון', value: `₪${dress.deposit}` } : null,
    {
      label: 'ניקוי יבש',
      value: dress.includes_dry_cleaning ? 'כלול במחיר' : 'לא כלול',
    },
    dress.rental_count > 0 ? { label: 'השכרות', value: String(dress.rental_count) } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row?.value));
}
