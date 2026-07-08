import { COMMISSION_PERCENT, OWNER_FORM_NOTICE } from '@/lib/commission';

/** באנר קצר למשכירות — בטופס פרסום שמלה בלבד */
export default function OwnerPlatformNotice() {
  return (
    <div className="bg-gradient-to-l from-[#fffdf9] to-[#f4ebd4] border border-[#e6c687] rounded-xl p-4 text-[11px] text-[#5c5037] leading-relaxed">
      <p className="font-black text-[#8b6508] text-center mb-2">✦ {OWNER_FORM_NOTICE.headline} ✦</p>
      <ul className="space-y-1.5 mb-3">
        {OWNER_FORM_NOTICE.bullets.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-[#d4af37] shrink-0">✓</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="text-center text-[10px] text-[#b8860b] font-bold">
        עמלה {COMMISSION_PERCENT}% · השוכרת משלמת מחיר מלא · את מקבלת {100 - COMMISSION_PERCENT}%
      </p>
    </div>
  );
}
