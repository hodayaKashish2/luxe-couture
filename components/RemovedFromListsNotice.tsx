'use client';

type RemovedFromListsNoticeProps = {
  names: string[];
  onDismiss: () => void;
};

export default function RemovedFromListsNotice({ names, onDismiss }: RemovedFromListsNoticeProps) {
  if (!names.length) return null;

  const preview =
    names.length === 1
      ? `«${names[0]}»`
      : names.length === 2
        ? `«${names[0]}» ו«${names[1]}»`
        : `${names.length} שמלות`;

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-950 leading-relaxed flex flex-wrap items-start justify-between gap-3">
      <p>
        <strong className="font-black">הוסרו מהרשימה:</strong> {preview} — השמלה{names.length === 1 ? '' : 'ות'}{' '}
        {names.length === 1 ? 'כבר לא' : 'כבר לא'} {names.length === 1 ? 'קיימת' : 'קיימות'} בקטלוג (הוסרה מהאתר).
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-[11px] font-bold text-amber-900 underline hover:no-underline"
      >
        הבנתי
      </button>
    </div>
  );
}
