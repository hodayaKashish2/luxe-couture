import {
  sendDressPendingAdminEmail,
  sendDressPendingOwnerEmail,
} from '@/lib/email';

export type DressSubmitNotifyParams = {
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

export type DressNotifyResult = {
  adminOk: boolean;
  ownerOk: boolean;
  adminError?: string;
  ownerError?: string;
};

export async function notifyDressSubmitted(params: DressSubmitNotifyParams): Promise<DressNotifyResult> {
  const adminMail = await sendDressPendingAdminEmail(params);
  if (!adminMail.success) {
    console.error('Dress pending admin email failed:', adminMail.error);
  }

  let ownerMail: { success: boolean; error?: string } = {
    success: false,
    error: params.ownerEmail?.trim() ? undefined : 'אין כתובת מייל למשכירה',
  };

  if (params.ownerEmail?.trim()) {
    ownerMail = await sendDressPendingOwnerEmail({
      to: params.ownerEmail,
      ownerName: params.ownerName,
      dressName: params.name,
    });
    if (!ownerMail.success) {
      console.error('Dress pending owner email failed:', ownerMail.error);
    }
  }

  return {
    adminOk: adminMail.success,
    ownerOk: ownerMail.success,
    adminError: adminMail.success ? undefined : adminMail.error,
    ownerError: ownerMail.success ? undefined : ownerMail.error,
  };
}
