'use client';

import { useState } from 'react';
import { ADMIN_DRESS_GRID_CLASS } from '@/components/admin/AdminCollapsibleSection';
import AdminDressDetailModal from '@/components/admin/AdminDressDetailModal';
import AdminDressEditModal from '@/components/admin/AdminDressEditModal';
import AdminDressGridCard from '@/components/admin/AdminDressGridCard';
import type { AdminDressRow } from '@/lib/admin-types';

type AdminPendingDressesGridProps = {
  dresses: AdminDressRow[];
  token: string;
  onApprove: (id: number) => Promise<boolean>;
  onRejectRequest: (id: number, dressName: string) => void;
  onSaved?: () => void;
};

export default function AdminPendingDressesGrid({
  dresses,
  token,
  onApprove,
  onRejectRequest,
  onSaved,
}: AdminPendingDressesGridProps) {
  const [detailDress, setDetailDress] = useState<AdminDressRow | null>(null);
  const [editingDress, setEditingDress] = useState<AdminDressRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function runApprove(id: number) {
    setBusyId(id);
    const ok = await onApprove(id);
    setBusyId(null);
    if (ok) {
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
          const disabled = busyId === dress.id;
          return (
            <AdminDressGridCard
              key={dress.id}
              dress={dress}
              disabled={disabled}
              onSelect={() => setDetailDress(dress)}
              badge={
                <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded-full shrink-0">
                  {dress.pending_update_kind === 'update' ? 'עדכון' : 'חדש'}
                </span>
              }
            />
          );
        })}
      </div>

      {detailDress && (
        <AdminDressDetailModal dress={detailDress} onClose={() => setDetailDress(null)}>
          <button
            type="button"
            onClick={() => {
              setEditingDress(detailDress);
              setDetailDress(null);
            }}
            className="px-4 py-2 text-sm rounded-xl border border-[#d4af37] text-[#8b6508] font-bold"
          >
            ✏️ עריכה
          </button>
          <button
            type="button"
            disabled={busyId === detailDress.id}
            onClick={() => runApprove(detailDress.id)}
            className="px-4 py-2 text-sm rounded-xl bg-[#b8860b] text-white font-bold disabled:opacity-50"
          >
            ✓ אשר
          </button>
          <button
            type="button"
            disabled={busyId === detailDress.id}
            onClick={() => onRejectRequest(detailDress.id, detailDress.name)}
            className="px-4 py-2 text-sm rounded-xl border border-red-300 text-red-600 font-bold disabled:opacity-50"
          >
            דחה
          </button>
        </AdminDressDetailModal>
      )}

      {editingDress && (
        <AdminDressEditModal
          dressId={editingDress.id}
          dressName={editingDress.name}
          token={token}
          onClose={() => setEditingDress(null)}
          onSaved={() => {
            setEditingDress(null);
            onSaved?.();
          }}
        />
      )}
    </>
  );
}
