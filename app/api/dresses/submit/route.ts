import { NextResponse } from 'next/server';
import { sendDressPendingAdminEmail } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function conditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  return 'יד שנייה';
}

async function uploadImages(files: File[]) {
  const supabase = getSupabaseAdmin();
  const imageUrls: string[] = [];
  const folder = `pending/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`הקובץ ${file.name} גדול מדי (מקסימום 5MB)`);
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from('dress-images')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('dress-images').getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  return imageUrls;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase לא מוגדר. פני למנהלת האתר.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get('name') || '').trim();
    const price = Number(formData.get('price'));
    const size = String(formData.get('size') || '').trim();
    const condition = String(formData.get('condition') || 'new').trim();
    const color = String(formData.get('color') || '').trim();
    const descriptionInput = String(formData.get('description') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const eventType = String(formData.get('event_type') || '').trim();
    const ownerName = String(formData.get('owner_name') || '').trim();
    const ownerPhone = String(formData.get('owner_phone') || '').trim();
    const ownerEmail = String(formData.get('owner_email') || '').trim();
    const deposit = Number(formData.get('deposit') || 0);
    const pickupMethod = String(formData.get('pickup_method') || 'pickup').trim();
    const includesDryCleaning = String(formData.get('includes_dry_cleaning') || 'no') === 'yes';
    const files = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);

    if (!name || !size || Number.isNaN(price)) {
      return NextResponse.json({ error: 'חסרים שדות חובה: שם, מחיר ומידה' }, { status: 400 });
    }

    if (!ownerName || !city) {
      return NextResponse.json({ error: 'חסרים שם משכירה ועיר' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'יש להעלות לפחות תמונה אחת של השמלה' }, { status: 400 });
    }

    if (files.length > MAX_IMAGES) {
      return NextResponse.json({ error: `ניתן להעלות עד ${MAX_IMAGES} תמונות` }, { status: 400 });
    }

    const descriptionParts = [
      descriptionInput || 'אין תיאור זמין.',
      color ? `צבע: ${color}` : '',
      `מצב: ${conditionLabel(condition)}`,
    ].filter(Boolean);

    const description = descriptionParts.join(' | ');
    const supabase = getSupabaseAdmin();
    const imageUrls = await uploadImages(files);

    const insertPayload: Record<string, unknown> = {
      name,
      price,
      size,
      condition,
      description,
      images: imageUrls,
      color,
      city,
      event_type: eventType,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      deposit: Number.isNaN(deposit) ? 0 : deposit,
      pickup_method: pickupMethod,
      includes_dry_cleaning: includesDryCleaning,
      status: 'pending',
    };

    let { data, error } = await supabase
      .from('dresses')
      .insert([insertPayload])
      .select('id, name, price, size, condition, description, images, status, created_at')
      .single();

    if (error?.message?.includes('includes_dry_cleaning')) {
      delete insertPayload.includes_dry_cleaning;
      ({ data, error } = await supabase
        .from('dresses')
        .insert([insertPayload])
        .select('id, name, price, size, condition, description, images, status, created_at')
        .single());
    }

    if (error?.message?.includes('owner_email')) {
      delete insertPayload.owner_email;
      ({ data, error } = await supabase
        .from('dresses')
        .insert([insertPayload])
        .select('id, name, price, size, condition, description, images, status, created_at')
        .single());
    }

    if (error) throw error;

    const mail = await sendDressPendingAdminEmail({
      dressId: data.id,
      name,
      price,
      size,
      city,
      ownerName,
      ownerPhone,
      ownerEmail,
      images: imageUrls,
    });
    if (!mail.success) {
      console.error('Dress pending admin email failed:', mail.error);
    }

    return NextResponse.json({
      success: true,
      message: 'השמלה נשלחה לאישור! היא תופיע באתר לאחר אישור בדף הניהול.',
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליחת השמלה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
