import Link from 'next/link';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, WHATSAPP_LINK } from '@/lib/site-config';

const footerLinkClass = 'text-sm font-semibold text-white underline decoration-white/70 underline-offset-4 transition-colors hover:text-[#f6eef1]';

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 w-full bg-[#6b2340] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="mb-3 text-2xl font-black text-white">{SITE_NAME}</h3>
          <p className="text-sm leading-relaxed text-white">
            פלטפורמה לתיווך בין בנות שמשכירות שמלות לבין בנות שמחפשות שמלה לאירוע — בקליק, בביטחון ובסטייל.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-base font-black text-white sm:text-lg">קישורים</h4>
          <ul className="space-y-3">
            <li>
              <Link href="/how-it-works" className={footerLinkClass}>
                איך זה עובד
              </Link>
            </li>
            <li>
              <Link href="/terms" className={footerLinkClass}>
                תקנון האתר
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={footerLinkClass}>
                מדיניות פרטיות
              </Link>
            </li>
            <li>
              <Link href="/contact" className={footerLinkClass}>
                צור קשר
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-base font-black text-white sm:text-lg">יצירת קשר</h4>
          <p className="mb-3 text-sm font-semibold">
            <a href={`mailto:${CONTACT_EMAIL}`} className={footerLinkClass}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-sm font-semibold">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
              WhatsApp: {CONTACT_PHONE}
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-white/25 py-4 text-center text-xs font-semibold text-white">
        © {new Date().getFullYear()} {SITE_NAME} · כל הזכויות שמורות
      </div>
    </footer>
  );
}
