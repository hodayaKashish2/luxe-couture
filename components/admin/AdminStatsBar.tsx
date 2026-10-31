import type { AdminOverview } from '@/lib/admin-types';

type AdminStatsBarProps = {
  stats: AdminOverview['stats'];
  onNavigate: (tab: string, featured?: 'all' | 'yes' | 'no') => void;
};

const cards = [
  { key: 'published', label: 'שמלות בקטלוג', tab: 'catalog', featured: 'all' as const },
  { key: 'pendingDresses', label: 'שמלות ממתינות', tab: 'pending', featured: 'all' as const },
  { key: 'pendingPayments', label: 'לאישור תשלום', tab: 'pending_payments', featured: 'all' as const },
  {
    key: 'pendingComments',
    label: 'תגובות ממתינות',
    tab: 'pending_comments',
    featured: 'all' as const,
    compute: (stats: AdminOverview['stats']) => stats.pendingReviews + stats.pendingRatings,
  },
] as const;

export default function AdminStatsBar({ stats, onNavigate }: AdminStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const value =
          'compute' in card ? card.compute(stats) : stats[card.key as keyof AdminOverview['stats']];
        const isAlert =
          (card.key === 'pendingComments' ||
            card.key === 'pendingDresses' ||
            card.key === 'pendingPayments') &&
          Number(value) > 0;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate(card.tab, card.featured)}
            className={`text-right rounded-xl border p-3 transition-shadow hover:shadow-md ${
              isAlert ? 'bg-amber-50 border-amber-300' : 'bg-white border-[#eadaaf]'
            }`}
          >
            <p className="text-[10px] text-[#6e634c] mb-1">{card.label}</p>
            <p className={`text-2xl font-black ${isAlert ? 'text-amber-800' : 'text-[#3d2f24]'}`}>
              {value}
            </p>
          </button>
        );
      })}
    </div>
  );
}
