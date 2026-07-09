'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import { SITE_NAME } from '@/lib/site-config';
import { getStoredDisplayName } from '@/lib/session-user';
import { SITE_AUTH_EVENT } from '@/lib/site-auth-events';
import { isLoggedIn, loginUrl } from '@/lib/require-login';

const links = [
  { href: '/', label: 'קטלוג', icon: '🏠' },
  { href: '/account', label: 'האזור שלי', icon: '👤' },
  { href: '/how-it-works', label: 'איך זה עובד', icon: '✨' },
  { href: '/terms', label: 'תקנון', icon: '📋' },
  { href: '/privacy', label: 'פרטיות', icon: '🔒' },
  { href: '/contact', label: 'צור קשר', icon: '💬' },
  { href: '/admin', label: 'ניהול', icon: '⚙️' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function NavLink({
  link,
  active,
  onClick,
  variant = 'tab',
}: {
  link: (typeof links)[number];
  active: boolean;
  onClick?: () => void;
  variant?: 'tab' | 'menu';
}) {
  if (variant === 'menu') {
    return (
      <Link
        href={link.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
          active
            ? 'bg-[#fffdf8] text-[#8b6508] border-2 border-[#d4af37]'
            : 'bg-white text-[#5c5037] border border-[#eadaaf] hover:border-[#d4af37]'
        }`}
      >
        <span className="text-lg">{link.icon}</span>
        {link.label}
      </Link>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`group relative inline-flex items-center gap-1.5 px-3 lg:px-5 py-2.5 lg:py-3 text-[11px] lg:text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all duration-200 border border-b-0 ${
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
      <span
        className={
          active
            ? 'underline decoration-[#d4af37] decoration-2 underline-offset-4'
            : 'group-hover:underline group-hover:decoration-[#decfa8] group-hover:underline-offset-4'
        }
      >
        {link.label}
      </span>
      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-l from-[#d4af37] to-[#b8860b] rounded-full" />
      )}
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { cartCount, favCount } = useLuxeStorage();
  const [userName, setUserName] = useState(() => getStoredDisplayName());
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [mobileOpen, setMobileOpen] = useState(false);

  const accountHref = loggedIn ? '/account' : loginUrl('/account');
  const cartHref = loggedIn ? '/account?section=cart' : loginUrl('/account?section=cart');
  const favHref = loggedIn ? '/account?section=favorites' : loginUrl('/account?section=favorites');
  const navLinks = links.map((link) =>
    link.href === '/account' ? { ...link, href: accountHref } : link
  );

  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(isLoggedIn());
      const u = sessionStorage.getItem('site_user');
      if (u) {
        try {
          setUserName(JSON.parse(u).displayName || '');
        } catch {
          setUserName('');
        }
      } else {
        setUserName('');
      }
    };
    syncAuth();
    window.addEventListener(SITE_AUTH_EVENT, syncAuth);
    return () => window.removeEventListener(SITE_AUTH_EVENT, syncAuth);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className="relative z-30 border-b-2 border-[#e6c687]/70 bg-white/95 backdrop-blur-md shadow-sm w-full max-w-[100vw]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
            <img
              src="/logo.svg"
              alt=""
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-[0_4px_14px_rgba(184,134,11,0.28)]"
            />
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={cartHref}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border-2 border-[#decfa8] bg-[#fffdf8] text-[#8b6508] hover:border-[#d4af37] transition-colors"
            >
              🛍️
              <span className="hidden sm:inline">סל קניות</span>
              <span className="sm:hidden">סל</span>
              {loggedIn && cartCount > 0 && (
                <span className="min-w-[1.1rem] px-1 py-0.5 rounded-full bg-[#d4af37] text-white text-[9px] sm:text-[10px] text-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href={favHref}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border-2 border-[#decfa8] bg-[#fffdf8] text-[#8b6508] hover:border-[#d4af37] transition-colors"
            >
              ❤️
              <span className="hidden sm:inline">מועדפים</span>
              {loggedIn && favCount > 0 && (
                <span className="min-w-[1.1rem] px-1 py-0.5 rounded-full bg-[#d4af37] text-white text-[9px] sm:text-[10px] text-center leading-none">
                  {favCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-[#decfa8] bg-[#fffdf8] text-[#8b6508] font-bold text-lg"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* תפריט נייד — כל הטאבים */}
        {mobileOpen && (
          <>
            <button
              type="button"
              className="md:hidden fixed inset-0 bg-black/30 z-40"
              aria-label="סגירת תפריט"
              onClick={() => setMobileOpen(false)}
            />
            <nav
              className="md:hidden relative z-50 mt-3 grid grid-cols-1 gap-2 pb-1"
              aria-label="ניווט נייד"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  link={link}
                  active={isActive(pathname, link.href)}
                  onClick={() => setMobileOpen(false)}
                  variant="menu"
                />
              ))}
            </nav>
          </>
        )}

        {/* טאבים — מחשב וטאבלט */}
        <nav
          className="hidden md:flex mt-3 gap-1 overflow-x-auto scrollbar-hide bg-[#f7f0de]/80 rounded-t-2xl px-1 lg:px-2 pt-1 border border-b-0 border-[#eadaaf] snap-x snap-mandatory"
          aria-label="ניווט ראשי"
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} link={link} active={isActive(pathname, link.href)} variant="tab" />
          ))}
        </nav>
        <div className="hidden md:block h-px bg-gradient-to-l from-transparent via-[#d4af37]/60 to-transparent -mt-px" />
      </div>
    </header>
  );
}
