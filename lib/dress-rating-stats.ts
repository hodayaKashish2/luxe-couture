import type { SupabaseClient } from '@supabase/supabase-js';

/** מחשב מחדש דירוג ממוצע לשמלה לפי דירוגים מאושרים בלבד */
export async function recalculateDressRatingStats(
  supabase: SupabaseClient,
  dressId: string | number
) {
  const { data: rows, error } = await supabase
    .from('dress_ratings')
    .select('stars')
    .eq('dress_id', dressId)
    .eq('status', 'approved');

  if (error) throw error;

  const approved = rows ?? [];
  const rating_count = approved.length;
  const rating_sum = approved.reduce((sum, row) => sum + Number(row.stars || 0), 0);

  const { error: updateError } = await supabase
    .from('dresses')
    .update({ rating_sum, rating_count })
    .eq('id', dressId);

  if (updateError) throw updateError;

  return {
    rating_count,
    rating_avg: rating_count > 0 ? Math.round((rating_sum / rating_count) * 10) / 10 : 0,
  };
}
