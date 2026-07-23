type Props = {
  message: string;
};

/** הודעת שגיאה אחידה וברורה בטפסים */
export default function FormError({ message }: Props) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-[#f0caca] bg-gradient-to-br from-[#fff7f7] to-[#fff0f0] p-4 shadow-sm"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-[#fee2e2] text-[#b45309] flex items-center justify-center text-sm">
          ✦
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-xs font-black text-[#8b3a3a] mb-1">רגע, משהו צריך תיקון</p>
          <p className="text-sm font-bold text-[#7f1d1d] leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
