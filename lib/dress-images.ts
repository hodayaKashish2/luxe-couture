import { getSupabaseAdmin } from '@/lib/supabase/server';

export const MAX_DRESS_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadDressImages(files: File[]) {
  const supabase = getSupabaseAdmin();
  const imageUrls: string[] = [];
  const folder = `dresses/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`הקובץ ${file.name} גדול מדי (מקסימום 5MB)`);
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from('dress-images')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('dress-images').getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  return imageUrls;
}
