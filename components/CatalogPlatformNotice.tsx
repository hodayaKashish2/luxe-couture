import Link from 'next/link';
import { CATALOG_PLATFORM_NOTICE } from '@/lib/commission';

/** באנר בראש הקטלוג — מסביר עמלה, השקעה בפלטפורמה וחובת תשלום דרך האתר */
export default function CatalogPlatformNotice() {
  const { badge, title, intro, points, warning, termsLabel } = CATALOG_PLATFORM_NOTICE;

  return (
    <div className="mb-4 rounded-2xl border border-[#e6c687]/80 bg-gradient-to-l from-[#fffdf9] via-white to-[#faf4e4] shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-l from-[#d4af37] via-[#e8c547] to-[#b8860b]" aria-hidden />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div
            className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center text-white text-lg shadow-md mx-auto sm:mx-0"
            aria-hidden
          >
            ✦
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-right">
            <p className="text-[10px] font-black tracking-[0.2em] text-[#b8860b] uppercase mb-1">{badge}</p>
            <h2 className="font-[family-name:var(--font-luxury)] text-base sm:text-lg text-[#3d2f24] leading-snug mb-2">
              {title}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#5c5037] leading-relaxed mb-3">{intro}</p>

            <ul className="space-y-2 text-xs sm:text-[13px] text-[#5c5037] leading-relaxed mb-3">
              {points.map((line) => (
                <li key={line} className="flex gap-2 items-start text-right">
                  <span className="text-[#d4af37] shrink-0 mt-0.5 font-black">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-[#e6c687]/60 bg-[#fff9ed]/80 px-3 py-2.5 mb-3">
              <p className="text-[11px] sm:text-xs text-[#8b6508] leading-relaxed font-bold">{warning}</p>
            </div>

            <Link
              href="/terms"
              className="inline-block text-[11px] font-bold text-[#b8860b] underline underline-offset-2 hover:text-[#8b6508]"
            >
              {termsLabel} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
