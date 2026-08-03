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
  const [busyId, setBusyId] = useState<number | null>(null);

  async function run(id: number, action: 'approve' | 'reject') {
    setBusyId(id);
    const ok = await onAction(id, action);
    setBusyId(null);
    if (ok) setExpandedId((prev) => (prev === id ? null : prev));
  }

  if (dresses.length === 0) {
    return <p className="text-xs text-[#6e634c]">אין שמלות ממתינות 🎉</p>;
  }

  return (
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
            onToggle={() => setExpandedId(isOpen ? null : dress.id)}
            badge={
              <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded-full shrink-0">
                {dress.pending_update_kind === 'update' ? 'עדכון' : 'חדש'}
              </span>
            }
          >
            <AdminDressDetailPanel dress={dress}>
              <div className="flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => run(dress.id, 'approve')}
                  className="px-2 py-1 text-[9px] rounded-lg bg-[#b8860b] text-white font-bold disabled:opacity-50"
                >
                  אשר
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => run(dress.id, 'reject')}
                  className="px-2 py-1 text-[9px] rounded-lg border border-red-300 text-red-600 disabled:opacity-50"
                >
                  דחה
                </button>
              </div>
            </AdminDressDetailPanel>
          </AdminDressGridCard>
        );
      })}
    </div>
  );
}
