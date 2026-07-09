import { ownerWhatsAppLink } from '@/lib/site-config';

function toIntlDigits(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  if (digits.length === 9) return `972${digits}`;
  return digits;
}

export function buildOwnerWhatsAppLink(phone: string, message: string) {
  const digits = toIntlDigits(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${text}`;
}

export type WhatsAppSendResult = {
  success: boolean;
  provider?: 'green-api' | 'callmebot';
  error?: string;
  waLink?: string;
};

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppSendResult> {
  const waLink = buildOwnerWhatsAppLink(phone, message);
  const intlPhone = toIntlDigits(phone);

  const greenInstance = process.env.GREEN_API_INSTANCE_ID?.trim();
  const greenToken = process.env.GREEN_API_TOKEN?.trim();
  if (greenInstance && greenToken) {
    try {
      const res = await fetch(
        `https://api.green-api.com/waInstance${greenInstance}/sendMessage/${greenToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${intlPhone}@c.us`,
            message,
          }),
        }
      );
      const data = await res.json();
      if (data?.idMessage) {
        return { success: true, provider: 'green-api', waLink };
      }
      return {
        success: false,
        provider: 'green-api',
        error: data?.message || JSON.stringify(data),
        waLink,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'שגיאת WhatsApp';
      return { success: false, error: msg, waLink };
    }
  }

  const callMeBotKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (callMeBotKey) {
    try {
      const url = new URL('https://api.callmebot.com/whatsapp.php');
      url.searchParams.set('phone', intlPhone);
      url.searchParams.set('text', message);
      url.searchParams.set('apikey', callMeBotKey);
      const res = await fetch(url.toString());
      const text = await res.text();
      if (res.ok && !text.toLowerCase().includes('error')) {
        return { success: true, provider: 'callmebot', waLink };
      }
      return { success: false, provider: 'callmebot', error: text || 'CallMeBot failed', waLink };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'שגיאת CallMeBot';
      return { success: false, error: msg, waLink };
    }
  }

  return { success: false, error: 'WhatsApp API לא מוגדר (GREEN_API או CALLMEBOT)', waLink };
}

export function dressApprovedWhatsAppMessage(ownerName: string, dressName: string) {
  return `שלום ${ownerName}! 🎉\nהשמלה "${dressName}" אושרה ומופיעה עכשיו בקטלוג באתר שמלה בקליק.\nכנסי לצפות: ${process.env.NEXT_PUBLIC_APP_URL || 'https://luxe-couture.vercel.app'}`;
}

export { ownerWhatsAppLink };
