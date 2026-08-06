export type DressSizeGroupId = 'children' | 'teen' | 'adult';

export type DressSizeEntry = {
  value: string;
  label: string;
  group: DressSizeGroupId;
};

export const DRESS_SIZE_GROUP_LABELS: Record<DressSizeGroupId, string> = {
  children: 'ילדות',
  teen: 'נערות',
  adult: 'מבוגרות',
};

export const DRESS_SIZE_GROUP_ORDER: DressSizeGroupId[] = ['children', 'teen', 'adult'];

/** Full rental size scale — children through adult. */
export const DRESS_SIZES: DressSizeEntry[] = [
  { value: '2', label: '2 (92)', group: 'children' },
  { value: '3', label: '3 (98)', group: 'children' },
  { value: '4', label: '4 (104)', group: 'children' },
  { value: '5', label: '5 (110)', group: 'children' },
  { value: '6', label: '6 (116)', group: 'children' },
  { value: '7', label: '7 (122)', group: 'children' },
  { value: '8', label: '8 (128)', group: 'children' },
  { value: '9', label: '9 (134)', group: 'children' },
  { value: '10', label: '10 (140)', group: 'children' },
  { value: '11', label: '11 (146)', group: 'children' },
  { value: '12', label: '12 (152)', group: 'children' },
  { value: '13', label: '13 (158)', group: 'children' },
  { value: '14', label: '14 (164)', group: 'teen' },
  { value: '16', label: '16 (170)', group: 'teen' },
  { value: 'XS', label: 'XS (34)', group: 'adult' },
  { value: 'S', label: 'S (36)', group: 'adult' },
  { value: 'M', label: 'M (38)', group: 'adult' },
  { value: 'L', label: 'L (40)', group: 'adult' },
  { value: 'XL', label: 'XL (42)', group: 'adult' },
  { value: 'XXL', label: 'XXL (46)', group: 'adult' },
  { value: '3XL', label: '3XL (48)', group: 'adult' },
];

export type DressSizeFilterGroup = {
  label: string;
  options: string[];
};

export function getDressSizeFilterGroups(): DressSizeFilterGroup[] {
  return DRESS_SIZE_GROUP_ORDER.map((groupId) => ({
    label: DRESS_SIZE_GROUP_LABELS[groupId],
    options: DRESS_SIZES.filter((size) => size.group === groupId).map((size) => size.label),
  })).filter((group) => group.options.length > 0);
}

export const FAQS = [
  {
    q: 'איך האתר עובד?',
    a: 'האתר מחבר בין בנות שיש להן שמלה בארון לבין בנות שמחפשות שמלה לאירוע. משכירה, שוכרת, תשלום מאובטח — והכל במקום אחד.',
  },
  {
    q: 'איך מתבצע התשלום?',
    a: 'לאחר סגירת ההזמנה מול המשכירה, התשלום מתבצע דרך האתר — בשלוש דרכים נוחות לבחירה: ביט, העברה בנקאית, או תשלום מאובטח בכרטיס אשראי. לאחר אישור ההנהלה שהתשלום התקבל, השמלה משוריינת לך לתאריך שבחרת ותישלח אלייך הודעת אישור במייל.',
  },
  {
    q: 'למה שמלות מסוימות מופיעות ראשונות?',
    a: 'הקטלוג ממוין לפי «מומלצות» — שילוב של שמלות חדשות, דירוגים, וחשיפה מוגברת לשמלות שמושכרות דרך האתר. אין תצוגה של מספר השכרות גולמי; במקום זה תראי תגיות כמו «חדשה», «מומלצת» או «מבוקשת».',
  },
  {
    q: 'מה עם פיקדון?',
    a: 'כל משכירה יכולה לקבוע פיקדון משלה. הפיקדון מוצג בכרטיס השמלה ומוסכם בין הצדדים.',
  },
  {
    q: 'איך מתבצעת ההזמנה?',
    a: 'בוחרות תאריך אירוע בלוח השנה. אם התאריך פנוי — מופיעים פרטי המשכירה לתיאום. אחרי סגירה מול המשכירה, מבצעים את התשלום דרך האתר בלבד. הושקעו באתר מאמצים, זמן וכסף כדי להקל על שוכרות ומשכירות — העברת תשלום מחוץ לאתר היא גזל גמור של השירות שבנינו עבורכן.',
  },
  {
    q: 'מה מדיניות הביטולים?',
    a: 'ביטול מומלץ עד 14 יום לפני האירוע. ביטול מאוחר — לפי הסכמה עם המשכירה. פרטים בתקנון.',
  },
];
