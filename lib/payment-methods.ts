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
  const encodedPhone = encodeURIComponent(phone);

  return {
    ios: `bit://transfer?phoneNumber=${encodedPhone}&amount=${amountStr}&recipientPhone=${intl}`,
    androidIntent: `intent://transfer?phoneNumber=${encodedPhone}&amount=${amountStr}#Intent;scheme=bit;package=com.bnhp.payments.paymentsapp;S.phoneNumber=${phone};S.amount=${amountStr};end`,
    fallback: `bit://pay?phoneNumber=${encodedPhone}&amount=${amountStr}&recipientPhone=${intl}`,
  };
}

export function openBitPayment(amount: number): void {
  if (typeof window === 'undefined') return;

  const links = buildBitTransferLinks(amount);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const target = isAndroid ? links.androidIntent : isIOS ? links.ios : links.fallback;
  window.location.href = target;

  window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = links.fallback;
    }
  }, 1200);
}
