import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { COMMISSION_PERCENT, OWNER_COMMISSION_EXPLAINER } from '@/lib/commission';
import { SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `תקנון האתר | ${SITE_NAME}`,
  description: `תקנון שימוש באתר ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <ContentPage title="תקנון האתר" subtitle={`תנאי שימוש ב-${SITE_NAME}`}>
      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">1. מהות השירות</h2>
        <p className="text-xs leading-relaxed">
          {SITE_NAME} הוא פלטפורמת תיווך להשכרת שמלות בין משכירות לשוכרות. האתר מספק חשיפה, הזמנה,
          תשלום מאובטח וליווי — ואינו מחזיק בשמלות.
        </p>
      </section>

      <section className="bg-gradient-to-l from-[#fffdf9] to-[#f4ebd4] border border-[#e6c687] rounded-xl p-5">
        <h2 className="font-[family-name:var(--font-luxury)] text-lg text-[#3d2f24] mb-2">
          2. תיווך בלבד — ללא אחריות לשמלה או לעסקה
        </h2>
        <p className="text-xs leading-relaxed mb-3">
          {SITE_NAME} פועל כפלטפורמת תיווך בלבד: אנחנו מחברים בין משכירות לשוכרות, מספקים חשיפה,
          הזמנה ותשלום מאובטח — אך איננו צד לעסקה ואיננו מחזיקים בשמלות.
        </p>
        <p className="text-xs leading-relaxed">
          לפיכך, אין לנו אחריות — במישרין או בעקיפין — למצב השמלה, לנזק, לאובדן, לאיחור במסירה או
          בהחזרה, או לכל מחלוקת, תביעה או דרישה בין המשכירה לשוכרת. כל הסדר ביניהן — מחיר, מועדים,
          מצב השמלה, פיקדון ותיקונים — הוא באחריותן הבלעדית והישירה זו מול זו.
        </p>
        <p className="text-xs leading-relaxed mt-2 text-[#6e634c]">
          השימוש באתר מהווה הסכמה לכך שהפלטפורמה אינה אחראית לתוצאות ההשכרה, ושכל פנייה בנושאים אלה
          תופנה ישירות בין הצדדים.
        </p>
      </section>

      <section className="bg-gradient-to-l from-[#fffdf9] to-[#f4ebd4] border border-[#e6c687] rounded-xl p-5">
        <h2 className="font-[family-name:var(--font-luxury)] text-lg text-[#3d2f24] mb-2">
          3. עמלת פלטפורמה ({COMMISSION_PERCENT}%)
        </h2>
        <p className="text-xs leading-relaxed mb-3">{OWNER_COMMISSION_EXPLAINER.body}</p>
        <ul className="text-xs space-y-2 list-none">
          <li className="flex gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>השוכרת משלמת את מחיר השמלה המלא — ללא תוספת עמלה מצדה.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>העמלה נגבית מהמשכירה בלבד, ומכסה תפעול, אבטחה, פרסום וליווי.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>{OWNER_COMMISSION_EXPLAINER.exposure}</span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">4. עבודה דרך האתר בלבד</h2>
        <p className="text-xs leading-relaxed">{OWNER_COMMISSION_EXPLAINER.theft}</p>
        <p className="text-xs leading-relaxed mt-2">
          משכירה שמפרסמת באתר מתחייבת שלא לתאם, לקבל תשלום או להשכיר מחוץ לפלטפורמה. הפרה עלולה
          להוביל להסרת השמלה מהאתר.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">5. תשלום</h2>
        <p className="text-xs leading-relaxed">
          התשלום מתבצע בכרטיס אשראי דרך Tranzila. האתר מעביר את יתרת התשלום למשכירה לאחר העסקה.
          פיקדון — לפי מה שמצוין בכרטיס השמלה.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">6. חשיפה בקטלוג</h2>
        <p className="text-xs leading-relaxed">
          שמלות עם מספר השכרות גבוה יותר מוצגות בתחילת הקטלוג ומקבלות חשיפה רחבה יותר — כך יותר
          שוכרות רואות אותן.
        </p>
        <p className="text-xs leading-relaxed mt-2">
          בקטלוג ניתן לסנן שמלות לפי מידה (מ-XS ועד XXL), עיר, צבע, סוג אירוע ומחיר.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">7. פרסום שמלה</h2>
        <p className="text-xs leading-relaxed">
          המשכירה מתחייבת שהשמלה בבעלותה, שהתמונות אמיתיות, ושפרטי המחיר (כולל ניקוי יבש) נכונים.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">8. ביטולים</h2>
        <p className="text-xs leading-relaxed">
          ביטול מומלץ עד 14 יום לפני האירוע. פרטים נוספים — בעמוד צור קשר.
        </p>
      </section>
    </ContentPage>
  );
}
