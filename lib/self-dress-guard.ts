import { phonesMatch, emailsMatch } from '@/lib/phone-match';

type DressOwnerFields = {
  owner_phone?: string;
  owner_email?: string;
};

type CustomerFields = {
  phone?: string;
  email?: string;
  userId?: string | number;
};

export function dressBelongsToCustomer(
  dress: DressOwnerFields,
  customer: CustomerFields | null | undefined
) {
  if (!customer) return false;

  const ownerPhone = String(dress.owner_phone || '').trim();
  const ownerEmail = String(dress.owner_email || '').trim();

  if (customer.phone?.trim() && ownerPhone && phonesMatch(customer.phone, ownerPhone)) {
    return true;
  }

  if (customer.email?.trim() && ownerEmail && emailsMatch(customer.email, ownerEmail)) {
    return true;
  }

  return false;
}

export const OWN_DRESS_MESSAGES = {
  booking: {
    title: 'זו השמלה שלך 💛',
    body:
      'השמלה הזו פרסמת בעצמך באתר, ולכן לא ניתן להזמין אותה לעצמך דרך הקטלוג. לניהול ההזמנות, התאריכים והתיאומים — היכנסי ל״השמלות שלי״ באזור האישי.',
  },
  coordinate: {
    title: 'זו השמלה שלך 💛',
    body:
      'השמלה הזו שלך! לתיאום עם שוכרות, צפייה בהזמנות ולוח השנה — עברי ל״השמלות שלי״ באזור האישי.',
  },
} as const;
