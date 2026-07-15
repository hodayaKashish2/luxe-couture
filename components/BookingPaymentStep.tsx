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
  paymentUrl: string | null;
  mockMode: boolean;
  isConfirming: boolean;
  onConfirmPayment: (method: PaymentMethod) => void;
  onBack: () => void;
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bit: 'ביט',
  credit: 'אשראי',
  bank: 'העברה בנקאית',
};

export default function BookingPaymentStep({
  amount,
  paymentUrl,
  mockMode,
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

  const handleCredit = () => {
    setMethod('credit');
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBank = () => {
    setMethod('bank');
    setShowBankDetails(true);
  };

  return (
    <div className="flex flex-col gap-4 my-auto">
      <h3 className="text-lg font-black text-neutral-900">💳 בחירת אמצעי תשלום</h3>
      <p className="text-xs text-[#5c5037] leading-relaxed">
        ההזמנה נשמרה. בחרי ביט, אשראי או העברה בנקאית — השלימי את התשלום, ואז לחצי <strong>אישור תשלום</strong>.
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
          onClick={handleCredit}
          className={`py-3 px-3 rounded-xl border text-xs font-black transition-colors ${
            method === 'credit'
              ? 'bg-[#2c261a] text-white border-[#2c261a]'
              : 'bg-white border-[#decfa8] text-neutral-900 hover:border-[#b8860b]'
          }`}
        >
          💳 תשלום באשראי
        </button>
      </div>

      <button
        type="button"
        onClick={handleBank}
        className={`w-full py-3 px-3 rounded-xl border text-xs font-black transition-colors ${
          method === 'bank'
            ? 'bg-[#2c261a] text-white border-[#2c261a]'
            : 'bg-white border-[#decfa8] text-neutral-900 hover:border-[#b8860b]'
        }`}
      >
        🏦 צפייה בפרטי העברה בנקאית
      </button>

      {method === 'bit' && (
        <div className="bg-[#f4ebd4]/60 border border-[#decfa8] rounded-xl p-3 text-xs text-[#5c5037] space-y-1">
          <p className="font-bold text-neutral-900">תשלום בביט</p>
          <p>
            האפליקציה אמורה להיפתח על עמוד ההעברה ל-<strong dir="ltr">{BIT_PHONE_DISPLAY}</strong> בסכום{' '}
            <strong>₪{amount}</strong>.
          </p>
          <p className="text-[10px] text-[#9a7b4f]">אחרי ההעברה לחצי אישור תשלום — נאשר ברגע שנקבל את הכסף.</p>
          <button
            type="button"
            onClick={() => openBitPayment(amount)}
            className="mt-1 text-[#8b6508] font-bold underline"
          >
            פתיחה מחדש של ביט להעברה
          </button>
        </div>
      )}

      {method === 'credit' && (
        <div className="bg-[#f4ebd4]/60 border border-[#decfa8] rounded-xl p-3 text-xs text-[#5c5037] space-y-2">
          <p className="font-bold text-neutral-900">תשלום מאובטח באשראי</p>
          {paymentUrl ? (
            <>
              <p>דף התשלום המאובטח נפתח בחלון חדש. אחרי סיום התשלום תישלח אלייך הודעת אישור אוטומטית במייל.</p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[#8b6508] font-bold underline"
              >
                פתיחה מחדש של דף התשלום המאובטח →
              </a>
            </>
          ) : (
            <p className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800">
              {mockMode
                ? 'מצב בדיקה — סליקת אשראי לא מוגדרת.'
                : 'דף התשלום לא זמין כרגע. צרי קשר או בחרי אמצעי תשלום אחר.'}
            </p>
          )}
        </div>
      )}

      {method === 'bank' && showBankDetails && (
        <div className="bg-white border border-[#decfa8] rounded-xl p-4 text-xs space-y-2">
          <p className="font-black text-neutral-900">פרטי העברה בנקאית</p>
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
          <p className="text-[10px] text-[#9a7b4f] pt-1">אחרי ביצוע ההעברה, לחצי אישור תשלום — נאשר ברגע שנקבל את הכסף.</p>
        </div>
      )}

      {method && method !== 'credit' && (
        <button
          type="button"
          onClick={() => onConfirmPayment(method)}
          disabled={isConfirming}
          className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl shadow-lg disabled:opacity-60"
        >
          {isConfirming ? 'שולחת...' : `✓ אישור תשלום (${METHOD_LABELS[method]})`}
        </button>
      )}

      {method === 'credit' && mockMode && !paymentUrl && (
        <button
          type="button"
          onClick={() => onConfirmPayment('credit')}
          disabled={isConfirming}
          className="w-full py-3.5 bg-[#2c261a] text-white text-xs font-black rounded-xl disabled:opacity-60"
        >
          {isConfirming ? 'שולחת...' : '✓ אישור תשלום (בדיקה)'}
        </button>
      )}

      <button type="button" onClick={onBack} className="text-xs text-[#8b6508] hover:underline">
        ← חזרה לפרטים
      </button>
    </div>
  );
}
