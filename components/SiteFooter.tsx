import Link from 'next/link';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, WHATSAPP_LINK } from '@/lib/site-config';

const footerLinkClass = 'text-sm font-bold text-white transition-colors hover:text-white/85';

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 w-full bg-[#6b2340] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="mb-3 font-[family-name:var(--font-luxury)] text-xl">{SITE_NAME}</h3>
          <p className="text-sm leading-relaxed text-white/70">
            פלטפורמה לתיווך בין בנות שמשכירות שמלות לבין בנות שמחפשות שמלה לאירוע.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-base font-black tracking-wide text-white sm:text-lg">קישורים</h4>
          <ul className="space-y-2">
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
          <h4 className="mb-3 text-base font-black tracking-wide text-white sm:text-lg">יצירת קשר</h4>
          <p className="mb-2 text-sm font-bold">
            <a href={`mailto:${CONTACT_EMAIL}`} className={footerLinkClass}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-sm font-bold">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:underline">
              WhatsApp: {CONTACT_PHONE}
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-white/20 py-4 text-center text-[11px] font-bold text-white">
        © {new Date().getFullYear()} {SITE_NAME} · כל הזכויות שמורות
      </div>
    </footer>
  );
}
