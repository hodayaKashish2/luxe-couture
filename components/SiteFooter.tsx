import Link from 'next/link';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, WHATSAPP_LINK } from '@/lib/site-config';

const footerLinkClass =
  'font-[family-name:var(--font-luxury)] text-[#b8860b] text-sm font-medium underline underline-offset-4 decoration-[#d4af37]/70 hover:text-[#8b6508] hover:decoration-[#d4af37] transition-colors';

const footerContactLinkClass =
  'font-[family-name:var(--font-luxury)] text-[#b8860b] text-sm underline underline-offset-4 decoration-[#d4af37]/50 hover:text-[#8b6508] transition-colors';

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-[#eadaaf] bg-white/70 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-[#5c5037]">
        <div>
          <h3 className="font-[family-name:var(--font-luxury)] text-lg text-[#3d2f24] mb-3">{SITE_NAME}</h3>
          <p className="leading-relaxed text-xs">
            פלטפורמה לתיווך בין בנות שמשכירות שמלות לבין בנות שמחפשות שמלה לאירוע — בקליק, בביטחון ובסטייל.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-[#8b6508] mb-3 text-xs">קישורים</h4>
          <ul className="space-y-2.5 text-xs">
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
          <h4 className="font-bold text-[#8b6508] mb-3 text-xs">יצירת קשר</h4>
          <p className="text-xs mb-2">
            <a href={`mailto:${CONTACT_EMAIL}`} className={footerContactLinkClass}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-xs mb-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-luxury)] text-[#25D366] text-sm font-medium underline underline-offset-4 hover:text-[#1da851] transition-colors"
            >
              WhatsApp: {CONTACT_PHONE}
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-[#f0e6cc] py-4 text-center text-[10px] text-[#9a7b4f]">
        © {new Date().getFullYear()} {SITE_NAME} · כל הזכויות שמורות
      </div>
    </footer>
  );
}
