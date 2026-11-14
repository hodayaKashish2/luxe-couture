import { OWNER_FORM_NOTICE } from '@/lib/commission';

/** באנר קצר למשכירות — בטופס פרסום שמלה בלבד */
export default function OwnerPlatformNotice() {
  return (
    <div className="bg-gradient-to-l from-[#fffafb] to-[#f3e9ec] border border-[#d4b4bb] rounded-xl p-4 text-[11px] text-[#6e5e62] leading-relaxed">
      <p className="font-black text-[#6b2340] text-center mb-2">✦ {OWNER_FORM_NOTICE.headline} ✦</p>
      <ul className="space-y-1.5">
        {OWNER_FORM_NOTICE.bullets.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-[#6b2340] shrink-0">✓</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
