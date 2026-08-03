/**
 * איפוס מלא של נתוני האתר (דיבוג → התחלה מאפס)
 * שימוש: node scripts/reset-all-site-data.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'dress-images';

function loadEnv() {
  if (!fs.existsSync('.env.local')) {
    throw new Error('חסר .env.local עם NEXT_PUBLIC_SUPABASE_URL ו-SUPABASE_SERVICE_ROLE_KEY');
  }
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

async function clearStorage(supabase) {
  console.log('🗑️  מוחק תמונות מ-Storage...');
  const paths = await listAllPaths(supabase);
  if (paths.length === 0) {
    console.log('   אין תמונות למחיקה');
    return;
  }

  const batchSize = 100;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw error;
    console.log(`   נמחקו ${Math.min(i + batchSize, paths.length)}/${paths.length} קבצים`);
  }
}

async function deleteAllRows(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .gte('created_at', '1970-01-01T00:00:00Z');

  if (error?.message?.includes('created_at')) {
    const fallback = await supabase.from(table).delete({ count: 'exact' }).neq('id', 0);
    if (fallback.error) throw fallback.error;
    return fallback.count ?? 0;
  }
  if (error) throw error;
  return count ?? 0;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log('⚠️  איפוס מלא — מוחק משתמשים, שמלות, הזמנות, דירוגים, תגובות ותמונות\n');

const tables = ['dress_ratings', 'bookings', 'reviews', 'dresses', 'site_users'];

for (const table of tables) {
  try {
    const deleted = await deleteAllRows(supabase, table);
    console.log(`✓ ${table}: ${deleted} רשומות נמחקו`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Could not find the table') || message.includes('schema cache')) {
      console.log(`– ${table}: טבלה לא קיימת, מדלג`);
    } else {
      throw err;
    }
  }
}

await clearStorage(supabase);

for (const table of tables) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (!error) {
    console.log(`   ${table} נותרו: ${count ?? 0}`);
  }
}

console.log('\n✅ האתר אופס. התחברי מחדש בדפדפן (סל/מועדפים נשמרים מקומית — רענון/יציאה ינקו).');
