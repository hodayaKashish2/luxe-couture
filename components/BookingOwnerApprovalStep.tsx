'use client';

type BookingOwnerApprovalStepProps = {
  dressName: string;
  eventDate: string;
  amount: number;
  customerEmail: string;
  onBack: () => void;
};

export default function BookingOwnerApprovalStep({
  dressName,
  eventDate,
  amount,
  customerEmail,
  onBack,
}: BookingOwnerApprovalStepProps) {
  return (
    <div className="flex flex-col gap-4 my-auto">
      <h3 className="text-lg font-black text-neutral-900">📨 הבקשה נשלחה למשכירה</h3>
      <p className="text-xs text-[#5c5037] leading-relaxed">
        בקשת השריון הועברה למשכירה לאישור. תקבלי מייל עם תשובה האם השריון אושר{' '}
        <strong>עד 72 שעות</strong> — ואם יאושר, תוכלי להשלים את התשלום.
      </p>

      <div className="bg-white border border-[#decfa8] rounded-xl p-4 text-xs space-y-2">
        <div className="flex justify-between gap-2">
          <span className="text-[#5c5037]">שמלה</span>
          <span className="font-black text-neutral-900">{dressName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#5c5037]">תאריך</span>
          <span className="font-bold text-[#8b6508]">{eventDate}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#5c5037]">סכום משוער</span>
          <span className="font-black text-neutral-900">₪{amount}</span>
        </div>
      </div>

      <div className="bg-[#f4ebd4]/60 border border-[#decfa8] rounded-xl p-3 text-xs text-[#5c5037] space-y-2">
        <p className="font-bold text-neutral-900">מה קורה עכשיו?</p>
        <ul className="space-y-1.5 list-none">
          <li>⏳ תשובה האם השריון אושר — <strong>עד 72 שעות</strong></li>
          <li>📧 עדכון יישלח ל-<strong dir="ltr">{customerEmail}</strong></li>
          <li>👤 פרטי המשכירה יופיעו ב<strong>«ההזמנות שלי»</strong> באזור האישי, תחת הזמנות ממתינות</li>
          <li>💳 רק אחרי אישור — תעברי לשלב התשלום</li>
        </ul>
      </div>

      <a
        href="/account?section=reservations"
        className="w-full py-3.5 text-center bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl shadow-lg"
      >
        מעקב באזור האישי →
      </a>

      <button type="button" onClick={onBack} className="text-xs text-[#8b6508] hover:underline">
        ← חזרה לקטלוג
      </button>
    </div>
  );
}
