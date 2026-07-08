import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: dress } = await supabase.from('dresses').select('id, price, name').eq('status', 'approved').limit(1).maybeSingle();
if (!dress) {
  console.log('NO_APPROVED_DRESS');
  process.exit(0);
}

console.log('Testing dress', dress.id);

const paymentInsert = await supabase.from('bookings').insert([
  {
    dress_id: dress.id,
    customer_name: 'test',
    customer_phone: '050',
    customer_email: 't@t.com',
    event_date: '2030-01-15',
    status: 'pending_payment',
    amount_total: 100,
    platform_fee: 10,
    owner_payout: 90,
  },
]).select('id').single();

if (paymentInsert.error) {
  console.log('PAYMENT_INSERT_ERROR:', paymentInsert.error.message);
} else {
  console.log('PAYMENT_INSERT_OK', paymentInsert.data.id);
  await supabase.from('bookings').delete().eq('id', paymentInsert.data.id);
}

const legacyInsert = await supabase.from('bookings').insert([
  {
    dress_id: dress.id,
    customer_name: 'test',
    customer_phone: '050',
    customer_email: 't@t.com',
    event_date: '2030-01-16',
    status: 'confirmed',
  },
]).select('id').single();

if (legacyInsert.error) {
  console.log('LEGACY_INSERT_ERROR:', legacyInsert.error.message);
} else {
  console.log('LEGACY_INSERT_OK', legacyInsert.data.id);
  await supabase.from('bookings').delete().eq('id', legacyInsert.data.id);
}

const pub = await supabase
  .from('dresses')
  .select('id, name, rental_count, rating_count')
  .eq('status', 'approved')
  .limit(1);
console.log('PUBLISHED_QUERY:', pub.error?.message || 'OK', pub.data?.length);
