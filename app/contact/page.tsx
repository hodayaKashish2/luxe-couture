import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, WHATSAPP_LINK } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `צור קשר | ${SITE_NAME}`,
  description: `יצירת קשר עם ${SITE_NAME}.`,
};

export default function ContactPage() {
  return (
    <ContentPage title="צור קשר" subtitle="נשמח לעזור בפרסום, הזמנה או כל שאלה">
      <p className="text-xs">
        האתר מופעל כפלטפורמת תיווך בין משכירות לשוכרות. לכל שאלה — פנו אלינו:
      </p>

      <div className="space-y-3 text-xs">
        <p>
          <strong>WhatsApp / טלפון:</strong>{' '}
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline font-bold">
            {CONTACT_PHONE}
          </a>
        </p>
        <p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold"
          >
            💬 שלחי הודעה ב-WhatsApp
          </a>
        </p>
        <p>
          <strong>אימייל:</strong>{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#b8860b] hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>

      <p className="text-xs text-[#9a7b4f] pt-2">
        זמן מענה משוער: עד 24 שעות בימי חול.
      </p>
    </ContentPage>
  );
}
