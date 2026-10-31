'use client';

type Props = {
  dressName: string;
  eventDate: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function formatHebrewDate(date: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export default function CancelReservationConfirmModal({
  dressName,
  eventDate,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[85] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#d4af37] relative"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center border font-bold disabled:opacity-50"
          aria-label="סגירה"
        >
          ✕
        </button>

        <div className="text-center space-y-4 pt-2">
          <span className="text-4xl block">⚠️</span>
          <div>
            <p className="text-[10px] tracking-widest text-[#9a7b4f] font-bold">✦ ביטול הזמנה ✦</p>
            <h3 className="text-xl font-black text-[#3d2f24] mt-1">לבטל את ההזמנה?</h3>
          </div>

          <div className="bg-[#fffdf8] border border-[#decfa8] rounded-xl p-4 text-right space-y-2">
            <p className="text-sm font-bold text-[#3d2f24]">{dressName}</p>
            <p className="text-xs text-[#8b6508] font-bold">📅 {formatHebrewDate(eventDate)}</p>
          </div>

          <p className="text-sm text-[#5c5037] leading-relaxed">
            התאריך ישוחרר לשוכרות אחרות, ותישלח אלייך ולמשכירה הודעת אישור במייל.
          </p>

          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-60"
            >
              {loading ? 'מבטלת...' : 'כן, לבטל את ההזמנה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 border-2 border-[#decfa8] text-[#8b6508] text-xs font-black rounded-xl hover:bg-[#fffdf8] disabled:opacity-60"
            >
              לא, להשאיר
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
