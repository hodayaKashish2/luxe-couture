import Link from 'next/link';
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, WHATSAPP_LINK } from '@/lib/site-config';

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
            <li><Link href="/how-it-works" className="hover:text-[#b8860b]">איך זה עובד</Link></li>
            <li><Link href="/terms" className="hover:text-[#b8860b]">תקנון האתר</Link></li>
            <li><Link href="/privacy" className="hover:text-[#b8860b]">מדיניות פרטיות</Link></li>
            <li><Link href="/contact" className="hover:text-[#b8860b]">צור קשר</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#8b6508] mb-3 text-xs">יצירת קשר</h4>
          <p className="text-xs mb-2">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[#b8860b]">{CONTACT_EMAIL}</a>
          </p>
          <p className="text-xs mb-2">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline font-bold">
              WhatsApp: {CONTACT_PHONE}
            </a>
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#25D366] hover:underline"
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
