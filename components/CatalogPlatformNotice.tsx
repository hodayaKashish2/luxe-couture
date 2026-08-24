import Link from 'next/link';
import { CATALOG_PLATFORM_NOTICE } from '@/lib/commission';

/** שורת מידע קומפקטית בראש הקטלוג */
export default function CatalogPlatformNotice() {
  const { headline, subline, context, warning, termsLabel } = CATALOG_PLATFORM_NOTICE;

  return (
    <div className="mb-3 rounded-xl border border-[#e6c687]/45 bg-[#fffdf9]/90 px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 text-center sm:text-right space-y-1">
          <p className="text-[10px] sm:text-[11px] text-[#6b5d42] leading-snug">
            {context}{' '}
            <span className="font-semibold text-[#8b6508]">{warning}</span>
          </p>
          <p className="text-[11px] sm:text-xs text-[#5c5037] leading-snug">
            <span className="font-bold text-[#8b6508]">{headline}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline mt-0.5 sm:mt-0">{subline}</span>
          </p>
        </div>
        <Link
          href="/terms"
          className="shrink-0 self-center sm:self-start text-[10px] sm:text-[11px] font-bold text-[#b8860b] underline underline-offset-2 hover:text-[#8b6508] whitespace-nowrap"
        >
          {termsLabel} →
        </Link>
      </div>
    </div>
  );
}
