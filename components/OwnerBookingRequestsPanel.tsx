'use client';

import { useState } from 'react';

import AdminRejectReasonModal from '@/components/admin/AdminRejectReasonModal';
import type { OwnerBookingRow } from '@/components/OwnerDressesPanel';

type OwnerBookingRequestsPanelProps = {
  requests: OwnerBookingRow[];
  onRefresh: () => void;
};

function formatHebrewDate(date: string) {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export default function OwnerBookingRequestsPanel({
  requests,
  onRefresh,
}: OwnerBookingRequestsPanelProps) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OwnerBookingRow | null>(null);
  const [error, setError] = useState('');

  if (requests.length === 0) return null;

  async function respond(bookingId: number, action: 'approve' | 'reject', reason?: string) {
    setBusyId(bookingId);
    setError('');
    try {
      const token = sessionStorage.getItem('site_token');
      const res = await fetch(`/api/user/owner-bookings/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-user-token': token } : {}),
        },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'לא הצלחנו לעדכן את הבקשה');
        return;
      }
      onRefresh();
    } catch {
      setError('תקלה בתקשורת. נסי שוב.');
    } finally {
      setBusyId(null);
      setRejectTarget(null);
    }
  }

  return (
    <>
      <div className="bg-[#fff8eb] rounded-2xl border-2 border-[#d4af37]/50 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gradient-to-l from-[#faf6eb] to-[#fffdf8] border-b border-[#eadaaf]">
          <p className="text-sm font-black text-[#3d2f24]">📨 בקשות שריון שממתינות לתשובתך</p>
          <p className="text-[10px] text-[#6e634c] mt-1 leading-relaxed">
            יש לך עד 48 שעות להגיב. הביטול האוטומטי עלול להתרחש עם סטייה — לעיתים כבר לאחר כ-45 שעות. אחרי 24 שעות תישלח תזכורת.
          </p>
        </div>
        <ul className="divide-y divide-[#f0e6cc]">
          {requests.map((b) => (
            <li key={b.id} className="px-4 py-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-[#3d2f24]">{b.dress_name}</p>
                  <p className="text-xs text-[#8b6508] font-bold mt-0.5">📅 {formatHebrewDate(b.event_date)}</p>
                </div>
                <span className="text-[10px] h-fit bg-[#f4ebd4] text-[#8b6508] px-2.5 py-1 rounded-full font-black">
                  ממתין לאישורך
                </span>
              </div>
              <div className="text-xs text-[#5c5037] space-y-0.5">
                <p>
                  <span className="font-bold">שוכרת:</span> {b.customer_name || 'לא צוין'}
                </p>
                {b.customer_phone && (
                  <p dir="ltr" className="text-left sm:text-right">
                    <span className="font-bold">טלפון:</span> {b.customer_phone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === b.id}
                  onClick={() => respond(b.id, 'approve')}
                  className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#166534] to-[#15803d] text-white text-xs font-black disabled:opacity-60"
                >
                  {busyId === b.id ? 'שולחת...' : '✓ מאשרת — השמלה פנויה'}
                </button>
                <button
                  type="button"
                  disabled={busyId === b.id}
                  onClick={() => setRejectTarget(b)}
                  className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-black disabled:opacity-60"
                >
                  ✕ לא זמינה
                </button>
              </div>
            </li>
          ))}
        </ul>
        {error && (
          <p className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 border-t border-red-100">{error}</p>
        )}
      </div>

      <AdminRejectReasonModal
        open={Boolean(rejectTarget)}
        title="דחיית בקשת שריון"
        description={
          rejectTarget
            ? `הסיבה תישלח לשוכרת (${rejectTarget.customer_name || 'לקוחה'}).`
            : ''
        }
        confirmLabel="שליחת דחייה"
        busy={busyId != null}
        onCancel={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) void respond(rejectTarget.id, 'reject', reason);
        }}
      />
    </>
  );
}
