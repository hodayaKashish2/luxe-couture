'use client';

import { useState } from 'react';
import DressImageFill from '@/components/DressImageFill';
import AdminImageLightbox from '@/components/admin/AdminImageLightbox';
import type { DressUpdateDiff } from '@/lib/dress-pending-update';

type AdminDressUpdateDiffPanelProps = {
  dressName: string;
  diff: DressUpdateDiff;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  submittedAt?: string;
  large?: boolean;
};

function DiffImage({
  url,
  label,
  large,
  onOpen,
}: {
  url: string;
  label?: string;
  large?: boolean;
  onOpen: (url: string, label?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(url, label)}
      className={`block rounded-xl overflow-hidden border-2 border-[#eadaaf] hover:border-[#d4af37] transition-colors text-right ${
        large ? 'w-full max-w-[200px]' : 'w-full'
      }`}
    >
      <DressImageFill
        src={url}
        alt=""
        className={large ? 'w-full h-48 sm:h-56' : 'w-full h-24 sm:h-28'}
      />
      {label && (
        <span className="block text-[10px] font-bold text-[#8b6508] bg-[#fffdf8] px-2 py-1">
          {label} · לחצי להגדלה
        </span>
      )}
    </button>
  );
}

export default function AdminDressUpdateDiffPanel({
  dressName,
  diff,
  ownerName,
  ownerPhone,
  ownerEmail,
  submittedAt,
  large = false,
}: AdminDressUpdateDiffPanelProps) {
  const [lightbox, setLightbox] = useState<{ src: string; label?: string } | null>(null);
  const { changes, imageChanges } = diff;
  const hasChanges = changes.length > 0 || imageChanges.removed.length > 0 || imageChanges.added.length > 0;
  const isSingleSwap = imageChanges.removed.length === 1 && imageChanges.added.length === 1;

  return (
    <div className={`space-y-3 ${large ? 'text-sm' : 'text-[10px]'}`}>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
        <p className={`font-black text-amber-900 ${large ? 'text-base' : 'text-[11px]'}`}>
          ✏️ עדכון לשמלה: {dressName}
        </p>
        <p className="text-[#6e634c] mt-1 leading-relaxed">
          מוצגים <strong>רק השינויים</strong> שביקשה המשכירה. בקטלוג עדיין מופיעה הגרסה הנוכחית עד
          האישור.
        </p>
      </div>

      {!hasChanges ? (
        <p className="text-[#6e634c]">לא זוהו שינויים בפרטים.</p>
      ) : (
        <div className="rounded-xl border border-[#eadaaf] bg-white p-3 space-y-3">
          {changes.length > 0 && (
            <div>
              <p className={`font-black text-[#3d2f24] mb-2 ${large ? 'text-sm' : 'text-[11px]'}`}>
                שינויים בפרטים
              </p>
              <ul className="space-y-2">
                {changes.map((change) => (
                  <li
                    key={change.field}
                    className="rounded-lg bg-[#fffdf8] border border-[#f0e8d0] px-3 py-2 leading-relaxed"
                  >
                    <div className="font-bold text-[#8b6508] mb-1">{change.label}</div>
                    <div className="text-[#9a7b4f] text-[10px]">היה:</div>
                    <div className="text-[#6e634c] line-through mb-2">{change.before}</div>
                    <div className="text-[#8b6508] text-[10px] font-bold">עכשיו:</div>
                    <strong className="text-[#3d2f24]">{change.after}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(imageChanges.removed.length > 0 || imageChanges.added.length > 0) && (
            <div>
              <p className={`font-black text-[#3d2f24] mb-2 ${large ? 'text-sm' : 'text-[11px]'}`}>
                שינויים בתמונות
              </p>
              {isSingleSwap ? (
                <div className={`grid grid-cols-2 gap-3 ${large ? 'max-w-md mx-auto' : ''}`}>
                  <DiffImage
                    url={imageChanges.removed[0]}
                    label="לפני (הוסר)"
                    large={large}
                    onOpen={(src, label) => setLightbox({ src, label })}
                  />
                  <DiffImage
                    url={imageChanges.added[0]}
                    label="אחרי (חדש)"
                    large={large}
                    onOpen={(src, label) => setLightbox({ src, label })}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {imageChanges.removed.length > 0 && (
                    <div>
                      <p className="font-bold text-[#6e634c] mb-1">הוסרו</p>
                      <div className={`grid gap-2 ${large ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
                        {imageChanges.removed.map((url) => (
                          <DiffImage
                            key={url}
                            url={url}
                            large={large}
                            onOpen={(src, label) => setLightbox({ src, label })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {imageChanges.added.length > 0 && (
                    <div>
                      <p className="font-bold text-[#6e634c] mb-1">נוספו</p>
                      <div className={`grid gap-2 ${large ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
                        {imageChanges.added.map((url) => (
                          <DiffImage
                            key={url}
                            url={url}
                            label="חדש"
                            large={large}
                            onOpen={(src, label) => setLightbox({ src, label })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(ownerName || ownerPhone || ownerEmail) && (
        <div className="text-[#6e634c] space-y-0.5 border-t border-[#f0e8d0] pt-2">
          {ownerName && <p>משכירה: {ownerName}</p>}
          {ownerPhone && (
            <p>
              טלפון: <span dir="ltr">{ownerPhone}</span>
            </p>
          )}
          {ownerEmail && (
            <p dir="ltr" className="truncate">
              {ownerEmail}
            </p>
          )}
        </div>
      )}

      {submittedAt && (
        <p className="text-[#9a7b4f]">
          נשלח: {new Date(submittedAt).toLocaleString('he-IL')}
        </p>
      )}

      {lightbox && (
        <AdminImageLightbox
          src={lightbox.src}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
