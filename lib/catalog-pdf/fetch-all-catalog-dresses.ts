import { dressKindLabel, listingTypeLabel } from '@/lib/dress-listing';
import { dressLengthLabel, dressStyleLabel, normalizeDressLength, normalizeDressStyle } from '@/lib/dress-style-length';
import { getCleanDescription } from '@/lib/dress-display';
import { getDressColorFromRow, normalizeDressImages } from '@/lib/dress-pending-update';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';

export async function fetchAllCatalogPdfDresses(): Promise<CatalogPdfDress[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase לא מוגדר');
  }

  const supabase = getSupabaseAdmin();
  const { data: dresses, error } = await supabase
    .from('dresses')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (dresses ?? []).map((row) => {
    const images = normalizeDressImages(row.images);
    const color = getDressColorFromRow({
      color: row.color as string | null,
      description: row.description as string | null,
    });

    return {
      id: String(row.id),
      name: String(row.name ?? 'שמלה'),
      price: Number(row.price ?? 0),
      size: String(row.size ?? '—'),
      city: String(row.city ?? '—'),
      color,
      description: getCleanDescription(String(row.description ?? '')),
      listingLabel: listingTypeLabel(String(row.listing_type || 'rent')),
      kindLabel: dressKindLabel(String(row.event_type || 'single')),
      styleLabel: dressStyleLabel(normalizeDressStyle(String(row.dress_style || ''))),
      lengthLabel: dressLengthLabel(normalizeDressLength(String(row.dress_length || ''))),
      imageUrl: images[0] ?? null,
    };
  });
}
