import { NextResponse } from 'next/server';
import { uploadDressImages } from '@/lib/dress-image-upload';
import { notifyDressSubmittedInBackground } from '@/lib/dress-submit-notify';
import { appendContactEmailToDescription } from '@/lib/dress-contact';
import { isValidDressKind, isValidListingType } from '@/lib/dress-listing';
import { isValidDressLength, isValidDressStyle } from '@/lib/dress-style-length';
import { formatAccountPhone } from '@/lib/dress-ownership';
import { getUserFromRequest } from '@/lib/user-auth';
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
  const owner = getUserFromRequest(request);
  if (!owner) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

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
    const dressStyleRaw = String(formData.get('dress_style') || 'classic').trim();
    const dressLengthRaw = String(formData.get('dress_length') || 'long').trim();
    const deposit = Number(formData.get('deposit') || 0);
    const pickupMethod = String(formData.get('pickup_method') || 'pickup').trim();
    const includesDryCleaning = String(formData.get('includes_dry_cleaning') || 'no') === 'yes';
    const ownerEmail = String(formData.get('owner_email') || '').trim();
    const files = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);

    const ownerPhone = formatAccountPhone(owner.phone);
    if (!ownerPhone) {
      return NextResponse.json({ error: 'יש להשלים מספר טלפון בפרופיל לפני הוספת שמלה' }, { status: 400 });
    }

    if (!isValidDressKind(dressKindRaw)) {
      return NextResponse.json({ error: 'נא לבחור סוג פריט — שמלה בודדת או סט' }, { status: 400 });
    }
    if (!isValidListingType(listingTypeRaw)) {
      return NextResponse.json({ error: 'נא לבחור סוג פרסום — השכרה או מכירה' }, { status: 400 });
    }
    if (!isValidDressStyle(dressStyleRaw)) {
      return NextResponse.json({ error: 'נא לבחור סגנון — שמרני, קלאסי או מודרני' }, { status: 400 });
    }
    if (!isValidDressLength(dressLengthRaw)) {
      return NextResponse.json({ error: 'נא לבחור אורך — קצר, אמצע או ארוך' }, { status: 400 });
    }

    const contactEmail = (ownerEmail || owner.email || '').trim().toLowerCase();
    const validationError = validateAddDressServerInput({
      name,
      price: String(price),
      size,
      city,
      color,
      dress_style: dressStyleRaw,
      dress_length: dressLengthRaw,
      owner_phone: ownerPhone,
      owner_email: contactEmail,
      requireEmail: true,
      imageCount: files.length,
      maxImages: MAX_DRESS_IMAGES,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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

    const supabase = getSupabaseAdmin();
    const imageUrls = await uploadDressImages(files);

    const insertPayload: Record<string, unknown> = {
      name,
      price,
      size,
      condition,
      description: appendContactEmailToDescription(descriptionParts.join(' | '), contactEmail),
      images: imageUrls,
      color,
      city,
      event_type: dressKindRaw,
      listing_type: listingTypeRaw,
      dress_style: dressStyleRaw,
      dress_length: dressLengthRaw,
      owner_name: owner.displayName,
      owner_phone: ownerPhone,
      owner_email: contactEmail,
      deposit: Number.isNaN(deposit) ? 0 : deposit,
      pickup_method: pickupMethod,
      includes_dry_cleaning: includesDryCleaning,
      status: 'pending',
      submitter_user_id: owner.userId,
    };

    let { data, error } = await supabase
      .from('dresses')
      .insert([insertPayload])
      .select('id, name')
      .single();

    if (error?.message?.includes('includes_dry_cleaning')) {
      delete insertPayload.includes_dry_cleaning;
      ({ data, error } = await supabase.from('dresses').insert([insertPayload]).select('id, name').single());
    }

    if (error?.message?.includes('listing_type')) {
      delete insertPayload.listing_type;
      ({ data, error } = await supabase.from('dresses').insert([insertPayload]).select('id, name').single());
    }

    if (error?.message?.includes('owner_email')) {
      delete insertPayload.owner_email;
      ({ data, error } = await supabase.from('dresses').insert([insertPayload]).select('id, name').single());
    }

    if (error?.message?.includes('submitter_user_id')) {
      delete insertPayload.submitter_user_id;
      ({ data, error } = await supabase.from('dresses').insert([insertPayload]).select('id, name').single());
    }

    if (error?.message?.includes('dress_style') || error?.message?.includes('dress_length')) {
      delete insertPayload.dress_style;
      delete insertPayload.dress_length;
      ({ data, error } = await supabase.from('dresses').insert([insertPayload]).select('id, name').single());
    }

    if (error) throw error;

    notifyDressSubmittedInBackground({
      dressId: data!.id,
      name,
      price,
      size,
      city,
      ownerName: owner.displayName,
      ownerPhone: owner.phone,
      ownerEmail: contactEmail,
      images: imageUrls,
    });

    return NextResponse.json({
      success: true,
      message: 'השמלה נשלחה לאישור! היא תופיע באתר לאחר אישור בדף הניהול.',
      id: data!.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
