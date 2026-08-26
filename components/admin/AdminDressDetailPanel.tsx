'use client';

import DressImageFill from '@/components/DressImageFill';
import { dressKindLabel, listingTypeLabel } from '@/lib/dress-listing';
import AdminDressUpdateDiffPanel from '@/components/admin/AdminDressUpdateDiffPanel';
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
  large?: boolean;
  children?: React.ReactNode;
};

export default function AdminDressDetailPanel({ dress, large = false, children }: AdminDressDetailPanelProps) {
  const images = Array.isArray(dress.images) ? dress.images : [];
  const textSize = large ? 'text-sm' : 'text-[9px]';

  if (dress.pending_update_kind === 'update' && dress.update_diff) {
    return (
      <div className="space-y-2 pt-1">
        <AdminDressUpdateDiffPanel
          dressName={dress.name}
          diff={dress.update_diff}
          ownerName={dress.owner_name}
          ownerPhone={dress.owner_phone}
          ownerEmail={dress.owner_email}
          submittedAt={dress.created_at}
          large={large}
        />
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <p className={`${textSize} text-[#6e634c]`}>
        #{dress.id} · {dress.size} · {dress.city}
        {dress.color ? ` · ${dress.color}` : ''}
      </p>
      <p className={`${textSize} text-[#6e634c]`}>
        משכירה: {dress.owner_name}
        {dress.owner_phone ? (
          <>
            {' · '}
            <span dir="ltr">{dress.owner_phone}</span>
          </>
        ) : null}
      </p>
      {dress.owner_email && (
        <p className={`${textSize} text-[#6e634c]`} dir="ltr">
          {dress.owner_email}
        </p>
      )}
      {dress.condition && (
        <p className={`${textSize} text-[#6e634c]`}>
          מצב: {CONDITION_LABELS[dress.condition] || dress.condition}
        </p>
      )}
      {dress.listing_type && (
        <p className={`${textSize} text-[#6e634c]`}>סוג פרסום: {listingTypeLabel(dress.listing_type)}</p>
      )}
      {dress.event_type && (
        <p className={`${textSize} text-[#6e634c]`}>סוג פריט: {dressKindLabel(dress.event_type)}</p>
      )}
      {dress.deposit != null && dress.deposit > 0 && (
        <p className={`${textSize} text-[#6e634c]`}>פיקדון: ₪{dress.deposit}</p>
      )}
      {dress.pickup_method && (
        <p className={`${textSize} text-[#6e634c]`}>
          איסוף: {PICKUP_LABELS[dress.pickup_method] || dress.pickup_method}
        </p>
      )}
      {dress.includes_dry_cleaning && (
        <p className={`${textSize} text-[#8b6508] font-bold`}>✓ ניקוי יבש כלול</p>
      )}
      {dress.description && (
        <p className={`${textSize} text-[#6e634c] leading-relaxed whitespace-pre-wrap`}>
          {dress.description}
        </p>
      )}
      {images.length > 0 && (
        <div className={`grid gap-2 pt-1 ${large ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3 gap-1'}`}>
          {images.map((url, index) => (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-[#eadaaf] hover:border-[#d4af37]"
            >
              <DressImageFill
                src={url}
                alt=""
                className={large ? 'w-full h-48 sm:h-56' : 'w-full h-16'}
              />
            </a>
          ))}
        </div>
      )}
      {dress.created_at && (
        <p className={`${large ? 'text-[10px]' : 'text-[8px]'} text-[#9a7b4f]`}>
          נשלחה: {new Date(dress.created_at).toLocaleString('he-IL')}
        </p>
      )}
      {children}
    </div>
  );
}
