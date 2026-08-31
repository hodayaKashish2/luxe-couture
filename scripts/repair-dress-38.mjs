import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  return Object.fromEntries(
    fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DRESS_ID = 38;
const COLOR = 'ורוד';

const { data: dress, error } = await sb.from('dresses').select('*').eq('id', DRESS_ID).single();
if (error || !dress) {
  console.error('dress not found', error?.message);
  process.exit(1);
}

const allImages = Array.isArray(dress.images) ? dress.images.map(String) : [];
// Keep the two original upload images (first folder batch), drop later update duplicates.
const folderKey = allImages[0]?.match(/pending\/[^/]+/)?.[0] || allImages[0]?.match(/dresses\/[^/]+/)?.[0];
const kept = folderKey
  ? allImages.filter((url) => url.includes(folderKey)).slice(0, 2)
  : allImages.slice(0, 2);

if (kept.length === 0) {
  console.error('no images to keep', allImages);
  process.exit(1);
}
const descriptionParts = String(dress.description || '')
  .split('|')
  .map((p) => p.trim())
  .filter((p) => p && !p.startsWith('צבע:'));

const description = [...descriptionParts, `צבע: ${COLOR}`, 'מצב: חדש עם תווית'].join(' | ');

const { error: updateError } = await sb
  .from('dresses')
  .update({
    color: COLOR,
    description,
    images: kept,
    pending_update: null,
    pending_update_submitted_at: null,
  })
  .eq('id', DRESS_ID);

if (updateError) {
  console.error('update failed', updateError.message);
  process.exit(1);
}

console.log('repaired dress', DRESS_ID, { color: COLOR, imageCount: kept.length, images: kept });
