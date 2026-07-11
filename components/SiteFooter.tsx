import Link from 'next/link';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, WHATSAPP_LINK } from '@/lib/site-config';

const footerLinkClass =
  'inline-flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl border border-[#eadaaf] bg-white/90 text-[#5c5037] font-bold hover:border-[#d4af37] hover:bg-[#fffdf8] hover:text-[#b8860b] hover:shadow-sm transition-all cursor-pointer';

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
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/how-it-works" className={footerLinkClass}>
                איך זה עובד
                <span className="text-[#d4af37] text-sm" aria-hidden>←</span>
              </Link>
            </li>
            <li>
              <Link href="/terms" className={footerLinkClass}>
                תקנון האתר
                <span className="text-[#d4af37] text-sm" aria-hidden>←</span>
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={footerLinkClass}>
                מדיניות פרטיות
                <span className="text-[#d4af37] text-sm" aria-hidden>←</span>
              </Link>
            </li>
            <li>
              <Link href="/contact" className={footerLinkClass}>
                צור קשר
                <span className="text-[#d4af37] text-sm" aria-hidden>←</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#8b6508] mb-3 text-xs">יצירת קשר</h4>
          <p className="text-xs mb-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-transparent hover:border-[#eadaaf] hover:bg-white/80 hover:text-[#b8860b] transition-all"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-xs mb-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-transparent text-[#25D366] hover:border-[#25D366]/30 hover:bg-white/80 font-bold transition-all"
            >
              WhatsApp: {CONTACT_PHONE}
            </a>
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#25D366]/40 bg-white/90 text-xs font-bold text-[#25D366] hover:bg-[#f0fff4] hover:shadow-sm transition-all"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-[#f0e6cc] py-4 text-center text-[10px] text-[#9a7b4f]">
        © {new Date().getFullYear()} {SITE_NAME} · כל הזכויות שמורות
      </div>
    </footer>
  );
}
