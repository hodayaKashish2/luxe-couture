'use client';

import DressImageFill from '@/components/DressImageFill';
import type { AdminDressRow } from '@/lib/admin-types';

const CONDITION_LABELS: Record<string, string> = {
  new: 'חדש עם תווית',
  'like-new': 'כמו חדש',
  used: 'יד שנייה',
};

const PICKUP_LABELS: Record<string, string> = {
  pickup: 'איסוף עצמי',
  delivery: 'משלוח (בתיאום)',
};

type AdminDressDetailPanelProps = {
  dress: AdminDressRow;
  children?: React.ReactNode;
};

export default function AdminDressDetailPanel({ dress, children }: AdminDressDetailPanelProps) {
  const images = Array.isArray(dress.images) ? dress.images : [];

  return (
    <div className="space-y-2 pt-1">
      <p className="text-[9px] text-[#6e634c]">
        #{dress.id} · {dress.size} · {dress.city}
        {dress.color ? ` · ${dress.color}` : ''}
      </p>
      <p className="text-[9px] text-[#6e634c]">
        משכירה: {dress.owner_name}
        {dress.owner_phone ? (
          <>
            {' · '}
            <span dir="ltr">{dress.owner_phone}</span>
          </>
        ) : null}
      </p>
      {dress.owner_email && (
        <p className="text-[9px] text-[#6e634c]" dir="ltr">
          {dress.owner_email}
        </p>
      )}
      {dress.condition && (
        <p className="text-[9px] text-[#6e634c]">
          מצב: {CONDITION_LABELS[dress.condition] || dress.condition}
        </p>
      )}
      {dress.event_type && (
        <p className="text-[9px] text-[#6e634c]">סוג אירוע: {dress.event_type}</p>
      )}
      {dress.deposit != null && dress.deposit > 0 && (
        <p className="text-[9px] text-[#6e634c]">פיקדון: ₪{dress.deposit}</p>
      )}
      {dress.pickup_method && (
        <p className="text-[9px] text-[#6e634c]">
          איסוף: {PICKUP_LABELS[dress.pickup_method] || dress.pickup_method}
        </p>
      )}
      {dress.includes_dry_cleaning && (
        <p className="text-[9px] text-[#8b6508] font-bold">✓ ניקוי יבש כלול</p>
      )}
      {dress.description && (
        <p className="text-[9px] text-[#6e634c] leading-relaxed whitespace-pre-wrap">
          {dress.description}
        </p>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1 pt-1">
          {images.map((url, index) => (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-[#eadaaf] hover:border-[#d4af37]"
            >
              <DressImageFill src={url} alt="" className="w-full h-16" />
            </a>
          ))}
        </div>
      )}
      {dress.created_at && (
        <p className="text-[8px] text-[#9a7b4f]">
          נשלחה: {new Date(dress.created_at).toLocaleString('he-IL')}
        </p>
      )}
      {children}
    </div>
  );
}
