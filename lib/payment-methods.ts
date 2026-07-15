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

function bitIntlPhone() {
  const digits = BIT_PHONE.replace(/\D/g, '');
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

export function buildBitTransferLinks(amount: number) {
  const phone = BIT_PHONE.replace(/\D/g, '');
  const intl = bitIntlPhone();
  const amountStr = Math.round(amount).toString();

  return {
    ios: `bit://transfer/phone/${phone}?amount=${amountStr}`,
    androidIntent: `intent://transfer/phone/${phone}?amount=${amountStr}#Intent;scheme=bit;package=com.bnhp.payments.paymentsapp;S.phoneNumber=${phone};S.amount=${amountStr};end`,
    fallback: `bit://pay?phoneNumber=${phone}&amount=${amountStr}&recipientPhone=${intl}`,
  };
}

export function openBitPayment(amount: number): void {
  if (typeof window === 'undefined') return;

  const links = buildBitTransferLinks(amount);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = links.androidIntent;
    return;
  }

  if (isIOS) {
    window.location.href = links.ios;
    return;
  }

  window.location.href = links.fallback;
}
