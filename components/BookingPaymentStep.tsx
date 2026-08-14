'use client';

import { useState } from 'react';

import {
  BANK_TRANSFER_DETAILS,
  BIT_PHONE_DISPLAY,
  openBitPayment,
  type PaymentMethod,
} from '@/lib/payment-methods';

type BookingPaymentStepProps = {
  amount: number;
  isConfirming: boolean;
  onConfirmPayment: (method: PaymentMethod) => void;
  onBack: () => void;
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bit: 'ביט',
  bank: 'העברה בנקאית',
};

export default function BookingPaymentStep({
  amount,
  isConfirming,
  onConfirmPayment,
  onBack,
}: BookingPaymentStepProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const handleBit = () => {
    setMethod('bit');
    openBitPayment(amount);
  };

  const handleBank = () => {
    setMethod('bank');
    setShowBankDetails((open) => !open);
  };

  return (
    <div className="flex flex-col gap-4 my-auto">
      <h3 className="text-lg font-black text-neutral-900">💳 בחירת אמצעי תשלום</h3>
      <p className="text-xs text-[#5c5037] leading-relaxed">
        ההזמנה נשמרה. בחרי ביט או העברה בנקאית — השלימי את התשלום, ואז לחצי <strong>אישור תשלום</strong>.
      </p>

      <div className="bg-white border border-[#decfa8] rounded-xl p-4 text-xs">
        <div className="flex justify-between font-black text-neutral-900">
          <span>סה״כ לתשלום</span>
          <span>₪{amount}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleBit}
          className={`py-3 px-3 rounded-xl border text-xs font-black transition-colors ${
            method === 'bit'
              ? 'bg-[#2c261a] text-white border-[#2c261a]'
              : 'bg-white border-[#decfa8] text-neutral-900 hover:border-[#b8860b]'
          }`}
        >
          📱 תשלום בביט
        </button>
        <button
          type="button"
          onClick={handleBank}
          className={`py-3 px-3 rounded-xl border text-xs font-black transition-colors ${
            method === 'bank'
              ? 'bg-[#2c261a] text-white border-[#2c261a]'
              : 'bg-white border-[#decfa8] text-neutral-900 hover:border-[#b8860b]'
          }`}
        >
          {method === 'bank' && showBankDetails ? '🏦 הסתרת פרטי בנק' : '🏦 העברה בנקאית'}
        </button>
      </div>

      {method === 'bit' && (
        <div className="bg-[#f4ebd4]/60 border border-[#decfa8] rounded-xl p-3 text-xs text-[#5c5037] space-y-1">
          <p className="font-bold text-neutral-900">תשלום בביט</p>
          <p>
            האפליקציה אמורה להיפתח על עמוד ההעברה ל-<strong dir="ltr">{BIT_PHONE_DISPLAY}</strong> בסכום{' '}
            <strong>₪{amount}</strong>.
          </p>
          <p className="text-[10px] text-[#9a7b4f]">אחרי ההעברה לחצי אישור תשלום — נשלח אלייך אישור במייל.</p>
          <button
            type="button"
            onClick={() => openBitPayment(amount)}
            className="mt-1 text-[#8b6508] font-bold underline"
          >
            פתיחה מחדש של ביט להעברה
          </button>
        </div>
      )}

      {method === 'bank' && showBankDetails && (
        <div className="bg-white border border-[#decfa8] rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-black text-neutral-900">פרטי העברה בנקאית</p>
            <button
              type="button"
              onClick={() => setShowBankDetails(false)}
              className="text-[10px] font-bold text-[#8b6508] hover:underline shrink-0"
            >
              ✕ סגירה
            </button>
          </div>
          <div className="space-y-1 text-[#5c5037]">
            <p>
              <span className="font-bold text-neutral-800">שם: </span>
              {BANK_TRANSFER_DETAILS.accountName}
            </p>
            <p>
              <span className="font-bold text-neutral-800">בנק: </span>
              {BANK_TRANSFER_DETAILS.bank}
            </p>
            <p>
              <span className="font-bold text-neutral-800">מספר חשבון: </span>
              {BANK_TRANSFER_DETAILS.accountNumber}
            </p>
            <p>
              <span className="font-bold text-neutral-800">סניף: </span>
              {BANK_TRANSFER_DETAILS.branch}
            </p>
            <p className="pt-1">
              <span className="font-bold text-neutral-800">סכום להעברה: </span>₪{amount}
            </p>
          </div>
          <p className="text-[10px] text-[#9a7b4f] pt-1">אחרי ביצוע ההעברה, לחצי אישור תשלום — נשלח אלייך אישור במייל.</p>
        </div>
      )}

      {method && (
        <button
          type="button"
          onClick={() => onConfirmPayment(method)}
          disabled={isConfirming}
          className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl shadow-lg disabled:opacity-60"
        >
          {isConfirming ? 'שולחת...' : `✓ אישור תשלום (${METHOD_LABELS[method]})`}
        </button>
      )}

      <button type="button" onClick={onBack} className="text-xs text-[#8b6508] hover:underline">
        ← חזרה לפרטים
      </button>
    </div>
  );
}
