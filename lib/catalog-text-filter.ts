function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[\s,/\\\-–—|]+/)
    .filter(Boolean);
}

/** City/color filter: prefix or whole-word match — not arbitrary substring (e.g. "ר" won't match "ירושלים"). */
export function matchesCatalogTextFilter(fieldValue: string, filterText: string): boolean {
  const filter = normalizeText(filterText);
  if (!filter) return true;
  if (filter.length < 2) return true;

  const field = normalizeText(fieldValue);
  if (!field) return false;

  if (field === filter || field.startsWith(filter)) return true;

  return tokenize(fieldValue).some((token) => token === filter || token.startsWith(filter));
}
