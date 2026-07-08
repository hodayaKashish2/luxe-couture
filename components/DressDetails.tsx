import type { Dress } from '@/lib/types';
import { getCleanDescription, getDressDetailRows } from '@/lib/dress-display';

type Props = {
  dress: Dress;
  compact?: boolean;
  showOwner?: boolean;
};

export default function DressDetails({ dress, compact = false, showOwner = false }: Props) {
  const description = getCleanDescription(dress.description);
  const rows = getDressDetailRows(dress);

  return (
    <div className="space-y-3">
      {description && (
        <p className={`text-[#5c5037] leading-relaxed ${compact ? 'text-[11px] line-clamp-2' : 'text-xs'}`}>
          {description}
        </p>
      )}

      <div
        className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}
      >
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-[#ede3c8] bg-[#fffdf8] px-3 py-2"
          >
            <p className="text-[9px] font-black text-[#9a7b4f] uppercase tracking-wide">{row.label}</p>
            <p className="text-[11px] font-bold text-[#3d2f24] mt-0.5">{row.value}</p>
          </div>
        ))}
      </div>

      {showOwner && dress.owner_name && (
        <p className="text-[10px] text-[#8b6508]">
          משכירה: <span className="font-bold">{dress.owner_name}</span>
        </p>
      )}
    </div>
  );
}
