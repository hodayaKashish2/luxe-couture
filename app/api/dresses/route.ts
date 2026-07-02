import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// התחברות למסד הנתונים באמצעות משתני הסביבה המאובטחים של השרת
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // שימוש ב-Service Role מונע בעיות הרשאה בבנייה
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// שליפת כל השמלות ממסד הנתונים
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// הוספת שמלה חדשה למסד הנתונים
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('dresses')
      .insert([
        {
          name: body.name,
          price: Number(body.price),
          size: body.size,
          condition: body.condition,
          images: body.images,
          description: body.description,
        },
      ])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
