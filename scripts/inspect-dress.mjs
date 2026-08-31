import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  if (!fs.existsSync('.env.local')) throw new Error('missing .env.local');
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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('missing supabase env');
  process.exit(1);
}

const sb = createClient(url, key);
const { data, error } = await sb
  .from('dresses')
  .select('id,name,color,description,images,pending_update,status,event_type')
  .ilike('name', '%aaa%');

if (error) {
  console.error(error.message);
  process.exit(1);
}

for (const row of data ?? []) {
  const images = Array.isArray(row.images) ? row.images : [];
  const pending = row.pending_update;
  console.log(
    JSON.stringify({
      id: row.id,
      name: row.name,
      status: row.status,
      colorColumn: row.color || '(empty)',
      description: row.description,
      event_type: row.event_type,
      imageCount: images.length,
      images: images.map((u, i) => `[${i}] ${String(u).slice(-40)}`),
      pending,
    }, null, 2)
  );
}
