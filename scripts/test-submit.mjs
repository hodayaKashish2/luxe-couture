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

const testPath = `pending/test-${Date.now()}/sample.txt`;
const buffer = Buffer.from('test upload');

const { error: uploadError } = await supabase.storage
  .from('dress-images')
  .upload(testPath, buffer, { contentType: 'text/plain', upsert: false });

if (uploadError) {
  console.log('STORAGE_UPLOAD_ERROR:', uploadError.message);
  process.exit(1);
}

console.log('STORAGE_UPLOAD_OK');

const { error: insertError } = await supabase.from('dresses').insert([
  {
    name: 'בדיקת מערכת',
    price: 100,
    size: 'M',
    condition: 'new',
    description: 'test',
    images: ['https://example.com/test.jpg'],
    status: 'pending',
  },
]);

if (insertError) {
  console.log('DB_INSERT_ERROR:', insertError.message);
  process.exit(1);
}

console.log('DB_INSERT_OK');

await supabase.storage.from('dress-images').remove([testPath]);
console.log('ALL_OK');
