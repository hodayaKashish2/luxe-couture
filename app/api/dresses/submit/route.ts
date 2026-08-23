import { NextResponse } from 'next/server';
import { uploadDressImages } from '@/lib/dress-image-upload';
import { notifyDressSubmittedInBackground } from '@/lib/dress-submit-notify';
import { appendContactEmailToDescription } from '@/lib/dress-contact';
import { isValidDressKind, isValidListingType } from '@/lib/dress-listing';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  MAX_DRESS_IMAGES,
  validateAddDressImageMeta,
  validateAddDressServerInput,
} from '@/lib/validate-add-dress-server';

function conditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  return 'יד שנייה';
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
    const dressKindRaw = String(formData.get('event_type') || 'single').trim();
    const listingTypeRaw = String(formData.get('listing_type') || 'rent').trim();
    const ownerName = String(formData.get('owner_name') || '').trim();
    const ownerPhone = String(formData.get('owner_phone') || '').trim();
    const ownerEmail = String(formData.get('owner_email') || '').trim();
    const deposit = Number(formData.get('deposit') || 0);
    const pickupMethod = String(formData.get('pickup_method') || 'pickup').trim();
    const includesDryCleaning = String(formData.get('includes_dry_cleaning') || 'no') === 'yes';
    const files = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);

    const validationError = validateAddDressServerInput({
      name,
      price: String(price),
      size,
      city,
      color,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      requireEmail: true,
      imageCount: files.length,
      maxImages: MAX_DRESS_IMAGES,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!isValidDressKind(dressKindRaw)) {
      return NextResponse.json({ error: 'נא לבחור סוג פריט — שמלה בודדת או סט' }, { status: 400 });
    }
    if (!isValidListingType(listingTypeRaw)) {
      return NextResponse.json({ error: 'נא לבחור סוג פרסום — השכרה או מכירה' }, { status: 400 });
    }

    for (const file of files) {
      const imageError = validateAddDressImageMeta(file);
      if (imageError) {
        return NextResponse.json({ error: imageError }, { status: 400 });
      }
    }

    const descriptionParts = [
      descriptionInput || 'אין תיאור זמין.',
      color ? `צבע: ${color}` : '',
      `מצב: ${conditionLabel(condition)}`,
    ].filter(Boolean);

    const description = appendContactEmailToDescription(descriptionParts.join(' | '), ownerEmail);
    const supabase = getSupabaseAdmin();
    const imageUrls = await uploadDressImages(files);

    const insertPayload: Record<string, unknown> = {
      name,
      price,
      size,
      condition,
      description,
      images: imageUrls,
      color,
      city,
      event_type: dressKindRaw,
      listing_type: listingTypeRaw,
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

    if (error?.message?.includes('listing_type')) {
      delete insertPayload.listing_type;
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
    if (!data) {
      return NextResponse.json({ error: 'שגיאה בשמירת השמלה' }, { status: 500 });
    }

    notifyDressSubmittedInBackground({
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
