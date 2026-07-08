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
    text: 'מסננות לפי מידה, מחיר וסוג אירוע. שמלות שהושכרו הרבה מופיעות ראשונות.',
  },
  {
    title: 'שריון ותשלום',
    text: 'בוחרות תאריך, ממלאות פרטים ומשלמות בכרטיס אשראי — מאובטח ופשוט.',
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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-white font-black flex items-center justify-center">
              {index + 1}
            </div>
            <div>
              <h2 className="font-bold text-[#3d2f24] mb-1">{step.title}</h2>
              <p className="text-xs leading-relaxed">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex flex-wrap gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-bold"
        >
          לקטלוג השמלות
        </Link>
        <Link href="/terms" className="px-5 py-2.5 border border-[#decfa8] rounded-xl text-xs font-bold text-[#8b6508]">
          קראי את התקנון
        </Link>
      </div>
    </ContentPage>
  );
}
