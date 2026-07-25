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

/** מאשר דירוג ממתין ומעדכן את סטטיסטיקות השמלה */
export async function approveDressRating(
  supabase: SupabaseClient,
  ratingId: string | number
) {
  const { data: rating, error: fetchError } = await supabase
    .from('dress_ratings')
    .select('id, dress_id, customer_name, stars, status')
    .eq('id', ratingId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!rating) return { error: 'דירוג לא נמצא', status: 404 as const };
  if (rating.status === 'approved') return { success: true as const, alreadyApproved: true };

  const { data: dress, error: dressError } = await supabase
    .from('dresses')
    .select('id, name, rating_sum, rating_count')
    .eq('id', rating.dress_id)
    .maybeSingle();

  if (dressError) throw dressError;
  if (!dress) return { error: 'שמלה לא נמצאה', status: 404 as const };

  const { error: updateRatingError } = await supabase
    .from('dress_ratings')
    .update({ status: 'approved' })
    .eq('id', ratingId);

  if (updateRatingError) throw updateRatingError;

  const newSum = Number(dress.rating_sum || 0) + Number(rating.stars);
  const newCount = Number(dress.rating_count || 0) + 1;

  const { error: updateDressError } = await supabase
    .from('dresses')
    .update({ rating_sum: newSum, rating_count: newCount })
    .eq('id', dress.id);

  if (updateDressError) throw updateDressError;

  return { success: true as const, dressName: dress.name, customerName: rating.customer_name };
}
