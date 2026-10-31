import type { Metadata } from 'next';
import Link from 'next/link';
import ContentPage from '@/components/ContentPage';
import { SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `איך זה עובד | ${SITE_NAME}`,
  description: 'מדריך קצר להשכרת שמלות ופרסום שמלה באתר.',
};

const steps = [
  {
    title: 'למשכירות — פרסמי שמלה',
    text: 'מעלות תמונות, מחיר, מידה ועיר. השמלה תופיע באתר אחרי פרסום.',
  },
  {
    title: 'לשוכרות — מצאי שמלה',
    text: 'מסננות לפי מידה, מחיר וסוג אירוע. הקטלוג מציג שמלות מומלצות לפי דירוגים, חדשות וחשיפה.',
  },
  {
    title: 'הזמנה ותשלום',
    text: 'בוחרות תאריך, שולחות בקשת שריון למשכירה, ומשלמות בביט או בהעברה בנקאית רק אחרי אישור — פשוט ובטוח.',
  },
  {
    title: 'אחרי האירוע',
    text: 'מחזירות את השמלה כפי שהוסכם. אפשר לשתף חוויה בתגובות.',
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPage
      title="איך זה עובד?"
      subtitle="פלטפורמה שמחברת בין בנות — עם תשלום מאובטח דרך האתר."
    >
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#6b2340] font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <h2 className="mb-1 font-bold text-[#2c2426]">{step.title}</h2>
              <p className="text-xs leading-relaxed">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#6b2340] px-5 py-2.5 text-xs font-bold text-white"
        >
          לקטלוג השמלות
        </Link>
        <Link href="/terms" className="rounded-full border border-[#ead8dc] px-5 py-2.5 text-xs font-bold text-[#6b2340]">
          קראי את התקנון
        </Link>
      </div>
    </ContentPage>
  );
}
