import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export default function ContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] text-[#332c1e]" dir="rtl">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-luxury)] text-3xl sm:text-4xl text-[#3d2f24]">{title}</h1>
          {subtitle && <p className="mt-3 text-sm text-[#6e634c] leading-relaxed">{subtitle}</p>}
          <div className="w-12 h-[1.5px] bg-[#d4af37] mx-auto mt-4" />
        </div>
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-[#eadaaf] p-6 sm:p-8 shadow-sm space-y-4 text-sm leading-relaxed text-[#554a33]">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
