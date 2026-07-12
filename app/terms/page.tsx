import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { COMMISSION_PERCENT, OWNER_COMMISSION_EXPLAINER } from '@/lib/commission';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `תקנון האתר | ${SITE_NAME}`,
  description: `תקנון שימוש באתר ${SITE_NAME}.`,
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

export default function TermsPage() {
  return (
    <ContentPage title="תקנון האתר" subtitle={`תנאי שימוש ב-${SITE_NAME} — נא לקרוא בעיון לפני השימוש`}>
      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">1. הסכמה לתנאים</h2>
        <p className="text-xs leading-relaxed">
          גלישה, הרשמה, פרסום שמלה, הזמנה או כל שימוש אחר באתר מהווים הסכמה מלאה, מפורשת ובלתי
          חוזרת לתקנון זה. מי שאינה מסכימה — אינה רשאית להשתמש באתר. התקנון מהווה הסכם מחייב בינך
          לבין מפעילת האתר.
        </p>
      </section>

      <HighlightSection title="2. מהות השירות — תיווך בלבד">
        <p className="text-xs leading-relaxed mb-3">
          {SITE_NAME} הוא פלטפורמת תיווך דיגיטלית בלבד. אנחנו מחברים בין משכירות לשוכרות, מספקים
          חשיפה, כלי הזמנה ותשלום — אך <strong>איננו צד לעסקה</strong>, איננו משכירים, איננו שוכרים,
          איננו מחזיקים בשמלות, איננו בודקים אותן פיזית, ואיננו מייצגים אף צד.
        </p>
        <p className="text-xs leading-relaxed">
          כל עסקת השכרה נעשית ישירות בין המשכירה לשוכרת. האחריות המלאה לעסקה — כולל מסירה, החזרה,
          מצב השמלה, תיאום, תשלומים נלווים ופתרון מחלוקות — חלה על הצדדים בלבד.
        </p>
      </HighlightSection>

      <HighlightSection title="3. ויתור אחריות והגבלת חבות">
        <p className="text-xs leading-relaxed mb-3">
          במידה המרבית המותרת על פי דין, <strong>אין למפעילת האתר כל אחריות</strong> — במישרין,
          בעקיפין, חוזית, נזיקית או אחרת — בגין:
        </p>
        <ul className="text-xs space-y-1.5 list-disc pr-5 mb-3">
          <li>מצב השמלה, התאמתה, ניקיונה, מידתה, מראהה או איכותה</li>
          <li>נזק, קרע, כתם, אובדן, גניבה או אי-החזרה של שמלה</li>
          <li>איחור במסירה, באיסוף או באירוע</li>
          <li>מחלוקת, הונאה, אי-קיום התחייבות או הפרת זכויות בין משכירה לשוכרת</li>
          <li>פגיעה בגוף, ברכוש או בנפש הנובעת מהשכרה, מסירה או שימוש בשמלה</li>
          <li>תוכן שפורסם על ידי משתמשות (טקסט, תמונות, מחירים, פרטי קשר)</li>
          <li>תקלות טכניות, השבתות, אובדן מידע או שיבושים באתר</li>
          <li>פעולה או מחדל של ספקי צד שלישי (לרבות סליקת אשראי, אחסון ענן, דוא״ל)</li>
        </ul>
        <p className="text-xs leading-relaxed mb-3">
          האתר מסופק <strong>&quot;כמות שהוא&quot; (AS IS)</strong> וללא כל התחייבות או אחריות,
          מפורשת או משתמעת, לרבות התאמה למטרה מסוימת, זמינות רציפה או דיוק המידע המוצג.
        </p>
        <p className="text-xs leading-relaxed">
          בשום מקרה לא תישא מפעילת האתר באחריות לנזקים עקיפים, תוצאתיים, מיוחדים, עונשיים או
          אובדן רווח. אחריות מצטברת מקסימלית — אם תיקבע בכלל — לא תעלה על הסכום ששולם בפועל
          למפעילת האתר בעסקה הרלוונטית, או 100 ₪ — לפי הנמוך מביניהם.
        </p>
      </HighlightSection>

      <HighlightSection title="4. שיפוי">
        <p className="text-xs leading-relaxed">
          המשתמשת מתחייבת לשפות ולפצות את מפעילת האתר, בעליה, עובדיה ונציגיה — בגין כל תביעה,
          דרישה, נזק, הוצאה או חבות (לרבות שכר טרחת עורך דין) הנובעים מ: (א) שימוש שלא כדין באתר;
          (ב) פרסום תוכן כוזב, מטעה או מפר זכויות; (ג) הפרת תקנון זה; (ד) עסקה או מחלוקת עם משתמשת
          אחרת; (ה) הפרת דין או זכויות צד שלישי.
        </p>
      </HighlightSection>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">5. אחריות המשתמשת ותוכן שפורסם</h2>
        <p className="text-xs leading-relaxed mb-2">
          כל משתמשת אחראית באופן בלעדי לתוכן שהיא מפרסמת ולמידע שהיא מוסרת. המשכירה מצהירה כי:
        </p>
        <ul className="text-xs space-y-1.5 list-disc pr-5">
          <li>השמלה בבעלותה או שהיא רשאית להשכירה</li>
          <li>התמונות, המחירים, המידות והתיאורים נכונים ואמיתיים</li>
          <li>פרטי הקשר שמסרה מעודכנים</li>
          <li>היא תעמוד בהתחייבויותיה כלפי השוכרת</li>
        </ul>
        <p className="text-xs leading-relaxed mt-2">
          מפעילת האתר רשאית — אך לא חייבת — לבדוק, לאשר, לערוך או להסיר תוכן לפי שיקול דעתה
          הבלעדי, ללא הודעה מוקדמת וללא צורך בנימוק.
        </p>
      </section>

      <section className="bg-gradient-to-l from-[#fffdf9] to-[#f4ebd4] border border-[#e6c687] rounded-xl p-5">
        <h2 className="font-[family-name:var(--font-luxury)] text-lg text-[#3d2f24] mb-2">
          6. עמלת פלטפורמה ({COMMISSION_PERCENT}%)
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
        <h2 className="font-bold text-[#3d2f24] mb-2">7. עבודה דרך האתר בלבד</h2>
        <p className="text-xs leading-relaxed">{OWNER_COMMISSION_EXPLAINER.theft}</p>
        <p className="text-xs leading-relaxed mt-2">
          משכירה שמפרסמת באתר מתחייבת שלא לתאם, לקבל תשלום או להשכיר מחוץ לפלטפורמה. הפרה עלולה
          להוביל להסרת שמלות, חסימת חשבון ופעולה משפטית — לפי שיקול דעת מפעילת האתר.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">8. תשלום וסליקה</h2>
        <p className="text-xs leading-relaxed">
          התשלום מתבצע בכרטיס אשראי דרך Tranzila או ספק סליקה מורשה אחר. מפעילת האתר אינה בנק,
          אינה מוסד פיננסי ואינה אחראית לתקלות סליקה, חיובים כפולים, ביטולי כרטיס או מחלוקות
          סביב החיוב — אלה יטופלו מול ספק הסליקה והצדדים לעסקה. פיקדון — לפי מה שמצוין בכרטיס
          השמלה, באחריות הצדדים בלבד.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">9. ביטולים והחזרים</h2>
        <p className="text-xs leading-relaxed">
          ביטול, דחייה או החזר כספי בין משכירה לשוכרת — באחריותן המשותפת והישירה. מפעילת האתר
          אינה צד להסדרי ביטול, אינה מתחייבת להחזר כספים, ואינה מחויבת ליישם ביניהן הסכמות. ביטול
          מומלץ עד 14 יום לפני האירוע — אך זהו המלצה בלבד ולא התחייבות משפטית של הפלטפורמה.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">10. חשיפה בקטלוג וסינון</h2>
        <p className="text-xs leading-relaxed">
          סדר הצגת שמלות, דירוג, חשיפה ותוצאות סינון נקבעים לפי שיקול דעת מפעילת האתר ואינם
          מהווים התחייבות לחשיפה, להזמנות או להכנסה. בקטלוג ניתן לסנן לפי מידה, עיר, צבע, סוג
          אירוע ומחיר.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">11. קטינות ושימוש אסור</h2>
        <p className="text-xs leading-relaxed">
          השימוש מיועד לבנות מגיל 18 ומעלה. אסור להשתמש באתר לפעילות בלתי חוקית, הטעיה, הטרדה,
          פרסום תוכן פוגעני או מפר זכויות, או ניסיון לעקוף את מנגנוני התשלום והעמלה.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">12. שינויים, הפסקת שירות וסמכות שיפוט</h2>
        <p className="text-xs leading-relaxed mb-2">
          מפעילת האתר רשאית לעדכן תקנון זה, להשעות או לסגור את האתר, ולחסום משתמשות — בכל עת וללא
          הודעה מוקדמת. עדכון יפורסם באתר ויחייב ממועד פרסומו.
        </p>
        <p className="text-xs leading-relaxed">
          על תקנון זה יחולו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים
          בישראל. אם סעיף מסוים יימצא בלתי תקף — יתר הסעיפים יישארו בתוקף.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">13. יצירת קשר</h2>
        <p className="text-xs leading-relaxed">
          לשאלות בנוגע לתקנון: {CONTACT_EMAIL}. פניות בנושאי מחלוקת בין משכירה לשוכרת — יש לפנות
          ישירות בין הצדדים; מפעילת האתר אינה מחויבת להיות מגשרת או בוררת.
        </p>
      </section>
    </ContentPage>
  );
}
