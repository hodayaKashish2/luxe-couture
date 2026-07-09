export type AuthModalReason = 'cart' | 'favorites' | 'account' | 'publish' | 'general';

type AuthModalCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

export const AUTH_MODAL_COPY: Record<AuthModalReason, AuthModalCopy> = {
  cart: {
    eyebrow: '✦ עגלה ✦',
    title: 'רוצה לשמור שמלות לעגלה?',
    body: 'כדי להוסיף שמלות לעגלה ולחזור אליהן בקלות — צריך חשבון קטן. ההרשמה לוקחת פחות מדקה.',
  },
  favorites: {
    eyebrow: '✦ מועדפים ✦',
    title: 'רוצה לשמור את השמלה?',
    body: 'כדי לשמור שמלות במועדפים ולמצוא אותן בקליק — התחברי או הירשמי. אפשר גם להמשיך לגלוש בלי חשבון.',
  },
  account: {
    eyebrow: '✦ האזור שלי ✦',
    title: 'האזור האישי שלך מחכה',
    body: 'כאן תמצאי שריונות, שמלות שפרסמת, עגלה ומועדפים. כדי להיכנס — התחברי או צרי חשבון חדש.',
  },
  publish: {
    eyebrow: '✦ פרסום שמלה ✦',
    title: 'יש לך שמלה בארון?',
    body: 'כדי לפרסם שמלה באתר ולאפשר לבנות אחרות לשכור ממך — צריך חשבון. ההרשמה מהירה ופשוטה.',
  },
  general: {
    eyebrow: '✦ ברוכה הבאה ✦',
    title: 'התחברי או הירשמי',
    body: 'חשבון מאפשר לשמור מועדפים, לפרסם שמלה מהארון ולגשת לאזור האישי. הגלישה בקטלוג תמיד חופשית.',
  },
};
