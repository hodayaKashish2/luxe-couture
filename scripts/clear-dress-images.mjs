/**
 * מחיקת כל תמונות השמלות מ-Supabase Storage
 * שימוש: node scripts/clear-dress-images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'dress-images';

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

async function listAllPaths(supabase, prefix = '') {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;

  let paths = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      paths.push(path);
    } else {
      paths.push(...(await listAllPaths(supabase, path)));
    }
  }
  return paths;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log('מחפש תמונות ב-bucket:', BUCKET);
const paths = await listAllPaths(supabase);
console.log('נמצאו', paths.length, 'קבצים');

if (paths.length === 0) {
  console.log('אין תמונות למחיקה.');
  process.exit(0);
}

const batchSize = 100;
let deleted = 0;
for (let i = 0; i < paths.length; i += batchSize) {
  const batch = paths.slice(i, i + batchSize);
  const { error } = await supabase.storage.from(BUCKET).remove(batch);
  if (error) throw error;
  deleted += batch.length;
  console.log(`נמחקו ${deleted}/${paths.length}`);
}

console.log('✅ כל התמונות נמחקו');
