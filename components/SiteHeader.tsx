'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import { SITE_NAME } from '@/lib/site-config';

const links = [
  { href: '/', label: 'קטלוג', icon: '🏠' },
  { href: '/account', label: 'האזור שלי', icon: '👤' },
  { href: '/how-it-works', label: 'איך זה עובד', icon: '✨' },
  { href: '/terms', label: 'תקנון', icon: '📋' },
  { href: '/privacy', label: 'פרטיות', icon: '🔒' },
  { href: '/contact', label: 'צור קשר', icon: '💬' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { cartCount, favCount } = useLuxeStorage();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const u = sessionStorage.getItem('site_user');
    if (u) {
      try {
        setUserName(JSON.parse(u).displayName || '');
      } catch {
        /* ignore */
      }
    }
  }, [pathname]);

  return (
    <header className="relative z-30 border-b-2 border-[#e6c687]/70 bg-white/95 backdrop-blur-md shadow-sm w-full max-w-[100vw]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
            <img src="/logo.svg" alt="" className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-[0_4px_14px_rgba(184,134,11,0.28)]" />
            <div className="min-w-0">
              <span className="font-[family-name:var(--font-luxury)] text-sm sm:text-lg tracking-[0.06em] sm:tracking-[0.1em] text-[#4a3728] font-medium block truncate">
                {SITE_NAME.split(' ')[0]}{' '}
                <span className="text-[#a67c00] font-light">{SITE_NAME.split(' ').slice(1).join(' ')}</span>
              </span>
              {userName && (
                <span className="text-[10px] text-[#9a7b4f] truncate block">שלום, {userName}</span>
              )}
            </div>
          </Link>

          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/account?section=cart"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border-2 border-[#decfa8] bg-[#fffdf8] text-[#8b6508] hover:border-[#d4af37] transition-colors"
            >
              🛍️
              <span className="hidden sm:inline">סל קניות</span>
              <span className="sm:hidden">סל</span>
              {cartCount > 0 && (
                <span className="min-w-[1.1rem] px-1 py-0.5 rounded-full bg-[#d4af37] text-white text-[9px] sm:text-[10px] text-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/account?section=favorites"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border-2 border-[#decfa8] bg-[#fffdf8] text-[#8b6508] hover:border-[#d4af37] transition-colors"
            >
              ❤️
              <span className="hidden sm:inline">מועדפים</span>
              {favCount > 0 && (
                <span className="min-w-[1.1rem] px-1 py-0.5 rounded-full bg-[#d4af37] text-white text-[9px] sm:text-[10px] text-center leading-none">
                  {favCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <nav
          className="mt-3 flex gap-1 overflow-x-auto scrollbar-hide bg-[#f7f0de]/80 rounded-t-2xl px-1 sm:px-2 pt-1 border border-b-0 border-[#eadaaf]"
          aria-label="ניווט ראשי"
        >
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative inline-flex items-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all duration-200 border border-b-0 ${
                  active
                    ? 'bg-white text-[#8b6508] border-[#d4af37] shadow-[0_-4px_16px_rgba(212,175,55,0.18)] z-10 -mb-px'
                    : 'bg-transparent text-[#7a6f58] border-transparent hover:bg-white/90 hover:text-[#b8860b] hover:border-[#decfa8] hover:shadow-[0_-2px_10px_rgba(212,175,55,0.12)] hover:-translate-y-0.5'
                }`}
              >
                <span
                  aria-hidden
                  className={`text-sm transition-transform duration-200 ${
                    active ? 'scale-110' : 'group-hover:scale-125 group-hover:drop-shadow-sm'
                  }`}
                >
                  {link.icon}
                </span>
                <span className={active ? 'underline decoration-[#d4af37] decoration-2 underline-offset-4' : 'group-hover:underline group-hover:decoration-[#decfa8] group-hover:underline-offset-4'}>
                  {link.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-l from-[#d4af37] to-[#b8860b] rounded-full" />
                )}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="group inline-flex items-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] font-bold whitespace-nowrap shrink-0 rounded-t-xl text-[#9a8f78] border border-b-0 border-transparent hover:bg-white/80 hover:text-[#6e634c] hover:border-[#eadaaf] hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="group-hover:scale-110 transition-transform">⚙️</span>
            ניהול
          </Link>
        </nav>
        <div className="h-px bg-gradient-to-l from-transparent via-[#d4af37]/60 to-transparent -mt-px" />
      </div>
    </header>
  );
}
