import { getSupabaseAdmin } from '@/lib/supabase/server';
import { dressRemovalPayload } from '@/lib/retention';

export async function markDressRemoved(dressId: number | string) {
  const supabase = getSupabaseAdmin();
  const payload = dressRemovalPayload();

  let { error } = await supabase.from('dresses').update(payload).eq('id', dressId);

  if (error?.message?.includes('removed_at')) {
    ({ error } = await supabase.from('dresses').update({ status: 'removed' }).eq('id', dressId));
  } else if (error?.message?.includes('removed') || error?.message?.includes('check constraint')) {
    ({ error } = await supabase.from('dresses').update({ status: 'rejected' }).eq('id', dressId));
  }

  if (error) throw error;
}
