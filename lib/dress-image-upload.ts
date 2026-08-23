import { getSupabaseAdmin } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadDressImages(files: File[]): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const folder = `pending/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const uploads = files.map(async (file) => {
    if (!file.type.startsWith('image/')) return null;
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
    return data.publicUrl;
  });

  const results = await Promise.all(uploads);
  return results.filter((url): url is string => url !== null);
}
