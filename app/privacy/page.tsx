import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `מדיניות פרטיות | ${SITE_NAME}`,
  description: `מדיניות פרטיות באתר ${SITE_NAME}.`,
};

function HighlightSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-gradient-to-l from-[#fffdf9] to-[#f4ebd4] border border-[#e6c687] rounded-xl p-5">
      <h2 className="font-[family-name:var(--font-luxury)] text-lg text-[#3d2f24] mb-2">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <ContentPage
      title="מדיניות פרטיות"
      subtitle={`${SITE_NAME} — איסוף, שימוש ושמירה על מידע אישי`}
    >
      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">1. כללי</h2>
        <p className="text-xs leading-relaxed">
          מדיניות פרטיות זו מסבירה כיצד {SITE_NAME} (&quot;האתר&quot;, &quot;אנחנו&quot;) אוסף,
          משתמש, שומר ומשתף מידע אישי. השימוש באתר מהווה הסכמה למדיניות זו ולתקנון האתר. אם אינך
          מסכימה — אין להשתמש באתר.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">2. איזה מידע נאסף?</h2>
        <ul className="text-xs space-y-1.5 list-disc pr-5">
          <li>פרטי זיהוי וקשר: שם, טלפון, אימייל, שם משתמש</li>
          <li>פרטי שמלה: תיאור, מחיר, מידה, עיר, צבע, תמונות, תאריכים</li>
          <li>פרטי הזמנה ותשלום: תאריכי אירוע, סטטוס הזמנה, מזהי עסקה (לא מספר כרטיס מלא)</li>
          <li>תגובות, דירוגים ותוכן שמשתמשות מפרסמות</li>
          <li>נתוני שימוש טכניים: כתובת IP, סוג דפדפן, נתוני מכשיר (לתפעול ואבטחה)</li>
          <li>מועדפים וסל — נשמרים בדפדפן (localStorage) במכשירך</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">3. למה משתמשים במידע?</h2>
        <ul className="text-xs space-y-1.5 list-disc pr-5">
          <li>תפעול פלטפורמת התיווך: פרסום, הזמנה, תשלום ויצירת קשר בין צדדים</li>
          <li>אישור תוכן, מניעת הונאה וניהול בקשות</li>
          <li>שליחת התראות תפעוליות למנהלת האתר</li>
          <li>שיפור חוויית המשתמש, תמיכה ואבטחת מידע</li>
          <li>עמידה בדרישות דין — ככל שנדרש</li>
        </ul>
      </section>

      <HighlightSection title="4. שיתוף מידע וחשיפה בין משתמשות">
        <p className="text-xs leading-relaxed mb-3">
          <strong>בשל אופי התיווך</strong>, מידע שמפרסמת (לרבות שם, טלפון, עיר, תמונות ותיאור שמלה)
          עשוי להיות גלוי למשתמשות אחרות באתר. את אחראית לפרטים שאת בוחרת לפרסם.
        </p>
        <p className="text-xs leading-relaxed">
          איננו מוכרים מידע אישי לצדדים שלישיים לצורכי פרסום. מידע עשוי להימסר לספקי שירות הנחוצים
          לתפעול האתר (לרבות Supabase לאחסון, Tranzila לסליקה, ושירותי דוא״ל) — בכפוף להתחייבויות
          סודיות ואבטחה מקובלות.
        </p>
      </HighlightSection>

      <HighlightSection title="5. אבטחת מידע והגבלת אחריות">
        <p className="text-xs leading-relaxed mb-3">
          אנו נוקטים באמצעי אבטחה סבירים להגנה על מידע, אך <strong>אין מערכת מאובטחת לחלוטין</strong>.
          במידה המרבית המותרת על פי דין, מפעילת האתר לא תישא באחריות לגישה בלתי מורשית, דליפת מידע,
          אובדן נתונים, פריצה, תקלה טכנית או שימוש לרעה שמקורם בגורמים שאינם בשליטתנו המלאה.
        </p>
        <p className="text-xs leading-relaxed">
          באחריותך לשמור על סיסמה, לא לשתף גישה לחשבון, ולדווח לנו על חשד לשימוש בלתי מורשה.
        </p>
      </HighlightSection>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">6. שמירת מידע</h2>
        <p className="text-xs leading-relaxed">
          מידע נשמר כל עוד נדרש לתפעול האתר, לעמידה בדין, ליישוב מחלוקות או לאכיפת תנאים. לאחר מכן
          יימחק או יאנונם — ככל שניתן וסביר. גיבויים ולוגים עשויים להישמר זמן נוסף לצרכי אבטחה
          ותפעול.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">7. זכויותייך</h2>
        <p className="text-xs leading-relaxed mb-2">
          בכפוף לחוק הגנת הפרטיות, התשמ&quot;א-1981, ולתקנות הרלוונטיות, עשויה להיות לך זכות לעיין,
          לתקן או לבקש מחיקת מידע אישי — בכפוף לחובות שמירה על פי דין ולצרכים תפעוליים לגיטימיים.
        </p>
        <p className="text-xs leading-relaxed">
          לפניות: {CONTACT_EMAIL}. נשתדל להשיב בתוך זמן סביר. מחיקת חשבון עשויה למנוע המשך שימוש
          בשירות.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">8. עוגיות ו-localStorage</h2>
        <p className="text-xs leading-relaxed">
          האתר שומר מועדפים, סל ומידע התחברות מקומי בדפדפן (localStorage) לנוחותך. אין שימוש
          בעוגיות פרסום או מעקב צד שלישי למטרות שיווק. ניתן למחוק נתונים אלה מהגדרות הדפדפן.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">9. קטינות</h2>
        <p className="text-xs leading-relaxed">
          האתר אינו מיועד לקטינים מתחת לגיל 18. אם נודע לנו שנאסף מידע מקטין שלא כדין — נפעל
          למחיקתו בהקדם האפשרי.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">10. שינויים במדיניות</h2>
        <p className="text-xs leading-relaxed">
          מפעילת האתר רשאית לעדכן מדיניות זו בכל עת. עדכון יפורסם באתר ויחייב ממועד פרסומו.
          המשך שימוש לאחר עדכון מהווה הסכמה לנוסח המעודכן.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">11. יצירת קשר</h2>
        <p className="text-xs leading-relaxed">
          לשאלות, בקשות מחיקה או עדכון מידע: {CONTACT_EMAIL}
        </p>
      </section>
    </ContentPage>
  );
}
