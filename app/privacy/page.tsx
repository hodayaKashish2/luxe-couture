import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `מדיניות פרטיות | ${SITE_NAME}`,
  description: `מדיניות פרטיות באתר ${SITE_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <ContentPage title="מדיניות פרטיות" subtitle={`${SITE_NAME} — שקיפות ושמירה על המידע שלך`}>
      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">איזה מידע נאסף?</h2>
        <p className="text-xs">
          שם, טלפון, אימייל, פרטי שמלה, תמונות, תגובות ותאריכי הזמנה — לצורך תפעול האתר, אישור תוכן ויצירת קשר.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">למה משתמשים במידע?</h2>
        <ul className="text-xs list-disc pr-5 space-y-1">
          <li>פרסום שמלות ותגובות מאושרות</li>
          <li>ניהול הזמנות ומניעת כפל הזמנות</li>
          <li>שליחת התראות למנהלת האתר</li>
          <li>שיפור חוויית המשתמש</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">שיתוף מידע</h2>
        <p className="text-xs">
          פרטי קשר של משכירה (שם, טלפון, עיר) מוצגים לשוכרות לאחר הזמנה/פרסום. לא נמכור מידע לצדדים שלישיים. מידע נשמר ב-Supabase (ענן מאובטח).
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">עוגיות ו-localStorage</h2>
        <p className="text-xs">
          האתר שומר מועדפים וסל בדפדפן (localStorage) לנוחותך. אין שימוש בעוגיות פרסום.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-[#3d2f24] mb-2">זכויותייך</h2>
        <p className="text-xs">
          ניתן לפנות אלינו לעדכון או מחיקת מידע אישי: {CONTACT_EMAIL}
        </p>
      </section>
    </ContentPage>
  );
}
