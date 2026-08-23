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
  const ownerEmail = params.ownerEmail?.trim();
  const [adminMail, ownerMail] = await Promise.all([
    sendDressPendingAdminEmail(params),
    ownerEmail
      ? sendDressPendingOwnerEmail({
          to: ownerEmail,
          ownerName: params.ownerName,
          dressName: params.name,
        })
      : Promise.resolve({
          success: false as const,
          error: 'אין כתובת מייל למשכירה',
        }),
  ]);

  if (!adminMail.success) {
    console.error('Dress pending admin email failed:', adminMail.error);
  }
  if (!ownerMail.success && ownerEmail) {
    console.error('Dress pending owner email failed:', ownerMail.error);
  }

  return {
    adminOk: adminMail.success,
    ownerOk: ownerMail.success,
    adminError: adminMail.success ? undefined : adminMail.error,
    ownerError: ownerMail.success ? undefined : ownerMail.error,
  };
}

/** שולח מיילים ברקע — לא מעכב את תגובת ה-API */
export function notifyDressSubmittedInBackground(params: DressSubmitNotifyParams): void {
  void notifyDressSubmitted(params).catch((error) => {
    console.error('Dress submit background notify failed:', error);
  });
}
