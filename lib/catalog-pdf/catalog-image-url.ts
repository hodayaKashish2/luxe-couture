/** תמונה קטנה יותר ל-PDF / מייל — מפחית משמעותית את גודל הקובץ */
export function compactCatalogImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const objectMarker = '/storage/v1/object/public/';
    const renderMarker = '/storage/v1/render/image/public/';

    if (parsed.pathname.includes(objectMarker)) {
      const suffix = parsed.pathname.split(objectMarker)[1];
      if (!suffix) return trimmed;
      parsed.pathname = `/storage/v1/render/image/public/${suffix}`;
      parsed.search = '?width=280&height=373&resize=cover&quality=55';
      return parsed.toString();
    }

    if (parsed.pathname.includes(renderMarker)) {
      parsed.searchParams.set('width', '280');
      parsed.searchParams.set('height', '373');
      parsed.searchParams.set('resize', 'cover');
      parsed.searchParams.set('quality', '55');
      return parsed.toString();
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function withCompactCatalogImages<T extends { imageUrl: string | null }>(dresses: T[]): T[] {
  return dresses.map((dress) => ({
    ...dress,
    imageUrl: compactCatalogImageUrl(dress.imageUrl),
  }));
}
