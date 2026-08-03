import { NextResponse } from 'next/server';

import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/user-auth';

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ dressIds: [] });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dress_ratings')
      .select('dress_id')
      .eq('rater_user_id', user.userId);

    if (error) {
      if (error.message.includes('rater_user_id')) {
        return NextResponse.json({ dressIds: [] });
      }
      throw error;
    }

    const dressIds = [...new Set((data ?? []).map((row) => String(row.dress_id)))];
    return NextResponse.json({ dressIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
