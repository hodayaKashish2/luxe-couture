import { getAppUrl } from '@/lib/email';

export function isTranzilaConfigured() {
  return Boolean(process.env.TRANZILA_TERMINAL?.trim());
}

export function buildTranzilaPaymentUrl(params: {
  amount: number;
  bookingId: string | number;
  description: string;
  customerName: string;
  customerEmail: string;
}) {
  const terminal = process.env.TRANZILA_TERMINAL?.trim();
  if (!terminal) return null;

  const baseUrl = getAppUrl();
  const successUrl = `${baseUrl}/api/payments/callback?bookingId=${params.bookingId}&status=success`;
  const failUrl = `${baseUrl}/api/payments/callback?bookingId=${params.bookingId}&status=fail`;

  const query = new URLSearchParams({
    sum: params.amount.toFixed(2),
    currency: '1',
    cred_type: '1',
    tranmode: 'AK',
    pdesc: params.description.slice(0, 120),
    contact: params.customerName.slice(0, 50),
    email: params.customerEmail,
    success_url_address: successUrl,
    fail_url_address: failUrl,
    notify_url_address: `${baseUrl}/api/payments/notify`,
    booking_id: String(params.bookingId),
  });

  return `https://direct.tranzila.com/${terminal}/iframenew.php?${query.toString()}`;
}
