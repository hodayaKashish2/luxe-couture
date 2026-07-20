import type { Dress } from '@/lib/types';
import { getDressRecommendScore } from '@/lib/dress-ranking';

const TOP_TIERS = 3;

/** @deprecated השתמשי ב-getCatalogHighlights */
export function getTopRentalRanks(dresses: Dress[]): Map<string, number> {
  const ranks = new Map<string, number>();
  const sorted = [...dresses].sort(
    (a, b) => getDressRecommendScore(b) - getDressRecommendScore(a)
  );

  let tier = 0;
  let prevScore: number | null = null;

  for (const dress of sorted) {
    const score = getDressRecommendScore(dress);
    if (score <= 0) continue;
    if (score !== prevScore) {
      tier += 1;
      prevScore = score;
      if (tier > TOP_TIERS) break;
    }
    if (tier <= TOP_TIERS) {
      ranks.set(dress.id, tier);
    }
  }

  return ranks;
}

function normalizeSortBy(sortBy: string) {
  if (sortBy === 'popular') return 'recommended';
  return sortBy;
}

/** מיון קטלוג */
export function compareDresses(a: Dress, b: Dress, sortBy: string) {
  const mode = normalizeSortBy(sortBy);

  if (mode === 'price-asc') {
    const priceDiff = a.price - b.price;
    if (priceDiff !== 0) return priceDiff;
    return getDressRecommendScore(b) - getDressRecommendScore(a);
  }

  if (mode === 'price-desc') {
    const priceDiff = b.price - a.price;
    if (priceDiff !== 0) return priceDiff;
    return getDressRecommendScore(b) - getDressRecommendScore(a);
  }

  if (mode === 'newest') {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    const timeDiff = bTime - aTime;
    if (timeDiff !== 0) return timeDiff;
    return getDressRecommendScore(b) - getDressRecommendScore(a);
  }

  const scoreDiff = getDressRecommendScore(b) - getDressRecommendScore(a);
  if (scoreDiff !== 0) return scoreDiff;

  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bTime - aTime;
}

export function toggleFilterValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
