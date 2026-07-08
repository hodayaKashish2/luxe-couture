import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const columns = ['id', 'name', 'price', 'size', 'condition', 'description', 'images', 'status', 'created_at'];

for (const column of columns) {
  const { error } = await supabase.from('dresses').select(column).limit(1);
  console.log(`${column}: ${error ? 'MISSING - ' + error.message : 'OK'}`);
}
