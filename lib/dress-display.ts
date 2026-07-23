import type { Dress } from '@/lib/types';

export const DRESS_DETAIL_NOT_SPECIFIED = 'לא צויין';

export function getConditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  if (condition === 'used') return 'יד שנייה';
  return condition || DRESS_DETAIL_NOT_SPECIFIED;
}

function displayDetailValue(value: string | number | null | undefined) {
  const text = String(value ?? '').trim();
  return text || DRESS_DETAIL_NOT_SPECIFIED;
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
    { label: 'עיר', value: displayDetailValue(dress.city) },
    { label: 'סוג אירוע', value: displayDetailValue(dress.event_type) },
    { label: 'צבע', value: displayDetailValue(dress.color) },
    {
      label: 'פיקדון',
      value: dress.deposit > 0 ? `₪${dress.deposit}` : DRESS_DETAIL_NOT_SPECIFIED,
    },
    {
      label: 'ניקוי יבש',
      value: dress.includes_dry_cleaning ? 'כלול במחיר' : 'לא כלול',
    },
  ];
}
