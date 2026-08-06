'use client';

import { useState } from 'react';
import { ADMIN_DRESS_GRID_CLASS } from '@/components/admin/AdminCollapsibleSection';
import AdminDressDetailPanel from '@/components/admin/AdminDressDetailPanel';
import AdminDressGridCard from '@/components/admin/AdminDressGridCard';
import type { AdminDressRow } from '@/lib/admin-types';

type AdminPendingDressesGridProps = {
  dresses: AdminDressRow[];
  onAction: (id: number, action: 'approve' | 'reject') => Promise<boolean>;
};

export default function AdminPendingDressesGrid({ dresses, onAction }: AdminPendingDressesGridProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailDress, setDetailDress] = useState<AdminDressRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function run(id: number, action: 'approve' | 'reject') {
    setBusyId(id);
    const ok = await onAction(id, action);
    setBusyId(null);
    if (ok) {
      setExpandedId((prev) => (prev === id ? null : prev));
      setDetailDress((prev) => (prev?.id === id ? null : prev));
    }
  }

  if (dresses.length === 0) {
    return <p className="text-xs text-[#6e634c]">אין שמלות ממתינות 🎉</p>;
  }

  return (
    <>
      <div className={ADMIN_DRESS_GRID_CLASS}>
        {dresses.map((dress) => {
          const isOpen = expandedId === dress.id;
          const disabled = busyId === dress.id;
          return (
            <AdminDressGridCard
              key={dress.id}
              dress={dress}
              isOpen={isOpen}
              disabled={disabled}
              onToggle={() => {
                if (dress.pending_update_kind === 'update') {
                  setDetailDress(dress);
                  return;
                }
                setExpandedId(isOpen ? null : dress.id);
              }}
              badge={
                <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded-full shrink-0">
                  {dress.pending_update_kind === 'update' ? 'עדכון' : 'חדש'}
                </span>
              }
            >
              <AdminDressDetailPanel dress={dress}>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setDetailDress(dress)}
                    className="px-2.5 py-1.5 text-[10px] rounded-lg border border-[#d4af37] text-[#8b6508] font-bold disabled:opacity-50"
                  >
                    🔍 צפייה בגדול
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => run(dress.id, 'approve')}
                    className="px-2.5 py-1.5 text-[10px] rounded-lg bg-[#b8860b] text-white font-bold disabled:opacity-50"
                  >
                    אשר
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => run(dress.id, 'reject')}
                    className="px-2.5 py-1.5 text-[10px] rounded-lg border border-red-300 text-red-600 disabled:opacity-50"
                  >
                    דחה
                  </button>
                </div>
              </AdminDressDetailPanel>
            </AdminDressGridCard>
          );
        })}
      </div>

      {detailDress && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailDress(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border-2 border-[#d4af37] bg-[#fffdf8] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#eadaaf] bg-[#fffdf8] px-4 py-3">
              <div>
                <p className="font-black text-lg text-[#3d2f24]">{detailDress.name}</p>
                <p className="text-xs text-[#8b6508] font-bold">
                  {detailDress.pending_update_kind === 'update' ? 'עדכון ממתין לאישור' : 'שמלה חדשה'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailDress(null)}
                className="w-9 h-9 rounded-full border border-[#eadaaf] bg-white font-bold text-[#3d2f24]"
                aria-label="סגירה"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AdminDressDetailPanel dress={detailDress} large>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#f0e8d0] mt-4">
                  <button
                    type="button"
                    disabled={busyId === detailDress.id}
                    onClick={() => run(detailDress.id, 'approve')}
                    className="px-4 py-2 text-sm rounded-xl bg-[#b8860b] text-white font-bold disabled:opacity-50"
                  >
                    ✓ אשר
                  </button>
                  <button
                    type="button"
                    disabled={busyId === detailDress.id}
                    onClick={() => run(detailDress.id, 'reject')}
                    className="px-4 py-2 text-sm rounded-xl border border-red-300 text-red-600 font-bold disabled:opacity-50"
                  >
                    דחה
                  </button>
                </div>
              </AdminDressDetailPanel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
