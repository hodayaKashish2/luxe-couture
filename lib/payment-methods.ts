import { CONTACT_PHONE } from '@/lib/site-config';

export const BIT_PHONE = '0534201133';
export const BIT_PHONE_DISPLAY = CONTACT_PHONE;

export const BANK_TRANSFER_DETAILS = {
  accountName: 'הודיה קשיש',
  bank: 'בנק הפועלים',
  accountNumber: '84202',
  branch: '290',
} as const;

export type PaymentMethod = 'bit' | 'credit' | 'bank';

export function buildBitAppLink(amount?: number): string {
  const phone = BIT_PHONE.replace(/\D/g, '');
  const amountQuery = amount != null ? `&amount=${Math.round(amount)}` : '';
  return `bit://transfer?phoneNumber=${phone}${amountQuery}`;
}

export function openBitPayment(amount: number): void {
  if (typeof window === 'undefined') return;

  const phone = BIT_PHONE.replace(/\D/g, '');
  const amountStr = Math.round(amount).toString();
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = `intent://transfer#Intent;scheme=bit;package=com.bnhp.payments.paymentsapp;S.phoneNumber=${phone};S.amount=${amountStr};end`;
    return;
  }

  window.location.href = buildBitAppLink(amount);
}
