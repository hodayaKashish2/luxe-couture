import Link from 'next/link';
import { CATALOG_PLATFORM_NOTICE } from '@/lib/commission';

export default function CatalogPlatformNotice() {
  const { headline, message, termsLabel } = CATALOG_PLATFORM_NOTICE;

  return (
    <div className="mb-5 rounded-2xl border-2 border-[#6b2340] bg-[#6b2340] px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-right">
          <p className="text-xs font-bold leading-relaxed text-white sm:text-[13px]">{headline}</p>
          <p className="text-[11px] leading-relaxed text-white/90 sm:text-xs">{message}</p>
        </div>
        <Link
          href="/terms"
          className="shrink-0 self-center text-[11px] font-bold text-white underline underline-offset-[3px] sm:self-start"
        >
          {termsLabel}
        </Link>
      </div>
    </div>
  );
}
