type Props = {
  message: string;
};

/** הודעת שגיאה אחידה וברורה בטפסים */
export default function FormError({ message }: Props) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3.5 leading-relaxed"
      dir="rtl"
    >
      <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-black mt-0.5">
        !
      </span>
      <p className="font-bold">{message}</p>
    </div>
  );
}
