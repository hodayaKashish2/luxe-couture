import { dressPageUrl } from '@/lib/site-config';
import type { Dress } from '@/lib/types';

function isShareCancelled(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function shareDressLink(
  dress: Pick<Dress, 'id' | 'name'>,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
) {
  const url = dressPageUrl(dress.id);
  const shareText = `שמתי לב לשמלה "${dress.name}" באתר שמלה בקליק`;

  try {
    if (navigator.share) {
      await navigator.share({ title: dress.name, text: shareText, url });
      onSuccess('השיתוף נשלח בהצלחה');
      return;
    }

    await navigator.clipboard.writeText(url);
    onSuccess('הקישור לשמלה הועתק — אפשר להדביק ולשלוח');
  } catch (error) {
    if (isShareCancelled(error)) return;

    try {
      await navigator.clipboard.writeText(url);
      onSuccess('הקישור לשמלה הועתק');
    } catch {
      onError('לא הצלחנו לשתף את הקישור');
    }
  }
}
