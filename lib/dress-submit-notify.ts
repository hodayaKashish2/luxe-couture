import {
  sendDressPendingAdminEmail,
  sendDressPendingOwnerEmail,
} from '@/lib/email';

type DressSubmitNotifyParams = {
  dressId: string | number;
  name: string;
  price: number;
  size: string;
  city: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  images: string[];
};

export async function notifyDressSubmitted(params: DressSubmitNotifyParams) {
  const adminMail = await sendDressPendingAdminEmail(params);
  if (!adminMail.success) {
    console.error('Dress pending admin email failed:', adminMail.error);
  }

  if (params.ownerEmail?.trim()) {
    const ownerMail = await sendDressPendingOwnerEmail({
      to: params.ownerEmail,
      ownerName: params.ownerName,
      dressName: params.name,
    });
    if (!ownerMail.success) {
      console.error('Dress pending owner email failed:', ownerMail.error);
    }
  }
}
