type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
};

export default function AdminPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: AdminPaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages: number[] = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#eadaaf]">
      <p className="text-xs text-[#6e634c]">
        מציג {from}–{to} מתוך {total}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-xs border border-[#decfa8] rounded-lg px-2 py-1.5 bg-white"
          >
            <option value={25}>25 בעמוד</option>
            <option value={50}>50 בעמוד</option>
          </select>
        )}

        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-[#decfa8] disabled:opacity-40 bg-white"
        >
          הקודם
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-8 px-2 py-1.5 text-xs rounded-lg border ${
              p === page
                ? 'bg-[#2c261a] text-white border-[#2c261a]'
                : 'bg-white border-[#decfa8] text-[#3d2f24]'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-[#decfa8] disabled:opacity-40 bg-white"
        >
          הבא
        </button>
      </div>
    </div>
  );
}
