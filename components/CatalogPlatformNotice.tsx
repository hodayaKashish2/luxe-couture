import Link from 'next/link';
import { CATALOG_PLATFORM_NOTICE } from '@/lib/commission';

/** שורת מידע קומפקטית בראש הקטלוג */
export default function CatalogPlatformNotice() {
  const { headline, message, termsLabel } = CATALOG_PLATFORM_NOTICE;

  return (
    <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl bg-[#f6eef1] px-4 py-3 sm:flex-row sm:justify-between">
      <div className="min-w-0 flex-1 text-center sm:text-right">
        <p className="text-xs font-bold leading-relaxed text-[#3a2430] sm:text-[13px]">{headline}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#5c4650] sm:text-xs">{message}</p>
      </div>

      <Link
        href="/terms"
        className="shrink-0 text-[12px] font-bold text-[#3a2430] underline decoration-[#3a2430]/70 underline-offset-4 transition-colors hover:text-[#6b2340]"
      >
        {termsLabel}
      </Link>
    </div>
  );
}
