'use client';

import type { ReactNode } from 'react';
import AdminDressDetailPanel from '@/components/admin/AdminDressDetailPanel';
import type { AdminDressRow } from '@/lib/admin-types';

type AdminDressDetailModalProps = {
  dress: AdminDressRow;
  subtitle?: string;
  onClose: () => void;
  children?: ReactNode;
};

export default function AdminDressDetailModal({
  dress,
  subtitle,
  onClose,
  children,
}: AdminDressDetailModalProps) {
  const defaultSubtitle =
    dress.pending_update_kind === 'update'
      ? 'עדכון ממתין לאישור'
      : dress.pending_update_kind === 'new'
        ? 'שמלה חדשה'
        : 'פרטי שמלה';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-2 border-[#d4af37] bg-[#fffdf8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#eadaaf] bg-[#fffdf8] px-4 py-3">
          <div className="min-w-0">
            <p className="font-black text-lg text-[#3d2f24] truncate">{dress.name}</p>
            <p className="text-xs text-[#8b6508] font-bold">{subtitle ?? defaultSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full border border-[#eadaaf] bg-white font-bold text-[#3d2f24] hover:bg-[#f4ebd4]"
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5">
          <AdminDressDetailPanel dress={dress} large>
            {children ? (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#f0e8d0] mt-4">{children}</div>
            ) : null}
          </AdminDressDetailPanel>
        </div>
      </div>
    </div>
  );
}
