'use client';

import { useCallback, useState } from 'react';
import CatalogEmailModal from '@/components/CatalogEmailModal';

const actionBtnClass =
  'text-[11px] font-bold text-[#8b6508] px-3 py-1.5 border border-[#d4af37] rounded-lg bg-[#fff8e8] hover:bg-[#fff3d6] transition-colors';

type CatalogAccessActionsProps = {
  onError?: (message: string) => void;
};

export default function CatalogAccessActions({ onError }: CatalogAccessActionsProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const closeEmailModal = useCallback(() => setEmailModalOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setEmailModalOpen(true)}
        className={actionBtnClass}
        title="קבלת הקטלוג במייל"
      >
        📧 שליחת הקטלוג במייל
      </button>

      <CatalogEmailModal open={emailModalOpen} onClose={closeEmailModal} onError={onError} />
    </>
  );
}
