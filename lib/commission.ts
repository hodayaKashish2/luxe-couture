export const COMMISSION_PERCENT = 10;

export function calculateCommission(rentalPrice: number) {
  const platformFee = Math.round(rentalPrice * (COMMISSION_PERCENT / 100) * 100) / 100;
  const ownerPayout = Math.round((rentalPrice - platformFee) * 100) / 100;
  return { platformFee, ownerPayout, total: rentalPrice };
}

/** הודעה למשכירות — מוצגת בטופס פרסום ובתקנון */
export const OWNER_COMMISSION_EXPLAINER = {
  title: `עמלה של ${COMMISSION_PERCENT}% — הוגנת ושקופה`,
  body: `מכל השכרה שמתבצעת דרך האתר נגבית עמלה של ${COMMISSION_PERCENT}% מהמשכירה — תמורת פלטפורמה, תשלום מאובטח, חשיפה וליווי. השוכרת משלמת את מחיר השמלה המלא; העמלה מנוכית מחלקך.`,
  theft:
    'השקענו בבניית האתר, באבטחה, בפרסום ובליווי אישי. כל עסקה מחוץ לפלטפורמה — בין אם בוואטסאפ ישיר או במזומן — היא גזל גמור של השירות שאנחנו מספקות.',
  exposure:
    'כל השכרה שעוברת דרכנו מעלה את מונה ההשכרות שלך. שמלות עם יותר השכרות מופיעות ראשונות בקטלוג, מקבלות חשיפה גבוהה יותר — ויותר בנות פונות אלייך. ככל שתעבדי איתנו — כך תרוויחי יותר.',
} as const;

/** הודעה קצרה לפני חשיפת פרטי משכירה בתיאום */
export const OFF_PLATFORM_COORDINATE_NOTICE = {
  title: 'רגע לפני שממשיכים',
  body:
    'השקענו מאמץ רב בבניית האתר — חשיפה, הזמנה, תשלום מאובטח וליווי. כל השכרה שמתבצעת מחוץ לפלטפורמה (וואטסאפ ישיר, מזומן וכו׳) פוגעת בשירות ומהווה גזל גמור של העבודה שלנו. בבקשה המשיכי דרך האתר בלבד.',
  cta: 'הבנתי — הציגי פרטי המשכירה',
} as const;

/** גרסה קצרה — רק בטופס הוספת שמלה */
export const OWNER_FORM_NOTICE = {
  headline: 'שווה לפרסם דרכנו',
  bullets: [
    'כל השכרה מעלה את השמלה לראש הקטלוג — יותר בנות רואות ופונות אלייך',
    `עמלה של ${COMMISSION_PERCENT}% בלבד — השוכרת משלמת מחיר מלא, את מקבלת ${100 - COMMISSION_PERCENT}%`,
    'תשלום מאובטח, הזמנה וליווי — הכל במקום אחד',
  ],
} as const;
