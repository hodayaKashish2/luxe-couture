'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import { useAuthModal } from '@/components/AuthModalProvider';
import { SITE_NAME } from '@/lib/site-config';
import { getStoredDisplayName } from '@/lib/session-user';
import { SITE_AUTH_EVENT } from '@/lib/site-auth-events';
import { navigateAccountHub } from '@/lib/account-hub-nav';
import { isLoggedIn } from '@/lib/require-login';

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
  guestOnClick,
  forceHub,
}: {
  link: (typeof links)[number];
  active: boolean;
  onClick?: () => void;
  variant?: 'tab' | 'menu';
  guestOnClick?: () => void;
  forceHub?: boolean;
}) {
  const classNameMenu = `flex items-center gap-3 px-4 py-3.5 min-h-[3rem] rounded-xl text-sm font-bold transition-colors ${
    active
      ? 'bg-[#fffdf8] text-[#8b6508] border-2 border-[#d4af37]'
      : 'bg-white text-[#5c5037] border border-[#eadaaf] hover:border-[#d4af37]'
  }`;
  const classNameTab = `group relative inline-flex items-center gap-1.5 px-3 lg:px-5 py-2.5 lg:py-3 text-[11px] lg:text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all duration-200 border border-b-0 ${
    active
      ? 'bg-white text-[#8b6508] border-[#d4af37] shadow-[0_-4px_16px_rgba(212,175,55,0.18)] z-10 -mb-px'
      : 'bg-transparent text-[#7a6f58] border-transparent hover:bg-white/90 hover:text-[#b8860b] hover:border-[#decfa8] hover:shadow-[0_-2px_10px_rgba(212,175,55,0.12)] hover:-translate-y-0.5'
  }`;

  if (forceHub) {
    const cls = variant === 'menu' ? classNameMenu : classNameTab;
    return (
      <button
        type="button"
        onClick={() => {
          navigateAccountHub();
          onClick?.();
        }}
        className={cls}
      >
        <span aria-hidden className={`text-sm ${variant === 'tab' ? 'transition-transform duration-200 group-hover:scale-125' : 'text-lg'}`}>
          {link.icon}
        </span>
        {link.label}
      </button>
    );
  }

  if (guestOnClick) {
    const cls = variant === 'menu' ? classNameMenu : classNameTab;
    return (
      <button type="button" onClick={() => { guestOnClick(); onClick?.(); }} className={cls}>
        <span aria-hidden className={`text-sm ${variant === 'tab' ? 'transition-transform duration-200 group-hover:scale-125' : 'text-lg'}`}>
          {link.icon}
        </span>
        {link.label}
      </button>
    );
  }

  if (variant === 'menu') {
    return (
      <Link href={link.href} onClick={onClick} className={classNameMenu}>
        <span className="text-lg">{link.icon}</span>
        {link.label}
      </Link>
    );
  }

  return (
    <Link href={link.href} onClick={onClick} className={classNameTab}>
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
  const { openAuthModal } = useAuthModal();
  const [userName, setUserName] = useState(() => getStoredDisplayName());
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  const openAccountAuth = () =>
    openAuthModal({ reason: 'account', next: '/account' });
  const openCartAuth = () =>
    openAuthModal({ reason: 'cart', next: '/account?section=cart' });
  const openFavAuth = () =>
    openAuthModal({ reason: 'favorites', next: '/account?section=favorites' });

  const actionBtnClass =
    'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border-2 border-[#decfa8] bg-[#fffdf8] text-[#8b6508] hover:border-[#d4af37] transition-colors';

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
    closeMobileMenu();
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
              alt={SITE_NAME}
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
            {!loggedIn && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openAuthModal({ reason: 'general', initialView: 'login' })}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold border-2 border-[#decfa8] bg-white text-[#8b6508] hover:border-[#d4af37] transition-colors"
                >
                  התחברות
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal({ reason: 'general', initialView: 'register' })}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white shadow-sm hover:shadow-md transition-shadow"
                >
                  הרשמה חינם
                </button>
              </div>
            )}
            {loggedIn ? (
              <Link href="/account?section=cart" className={actionBtnClass}>
                🛍️
                <span className="hidden sm:inline">סל קניות</span>
                <span className="sm:hidden">סל</span>
                {cartCount > 0 && (
                  <span className="min-w-[1.1rem] px-1 py-0.5 rounded-full bg-[#d4af37] text-white text-[9px] sm:text-[10px] text-center leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            ) : (
              <button type="button" onClick={openCartAuth} className={actionBtnClass}>
                🛍️
                <span className="hidden sm:inline">סל קניות</span>
                <span className="sm:hidden">סל</span>
              </button>
            )}
            {loggedIn ? (
              <Link href="/account?section=favorites" className={actionBtnClass}>
                ❤️
                <span className="hidden sm:inline">מועדפים</span>
                {favCount > 0 && (
                  <span className="min-w-[1.1rem] px-1 py-0.5 rounded-full bg-[#d4af37] text-white text-[9px] sm:text-[10px] text-center leading-none">
                    {favCount}
                  </span>
                )}
              </Link>
            ) : (
              <button type="button" onClick={openFavAuth} className={actionBtnClass}>
                ❤️
                <span className="hidden sm:inline">מועדפים</span>
              </button>
            )}
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
              className="md:hidden fixed inset-x-0 bottom-0 top-[4.5rem] z-[90] bg-black/30"
              aria-label="סגירת תפריט"
              onClick={closeMobileMenu}
            />
            <nav
              className="md:hidden fixed inset-x-0 top-[4.5rem] z-[100] bg-white/98 backdrop-blur-md border-b-2 border-[#e6c687] shadow-xl px-3 py-3 pb-5 max-h-[calc(100dvh-4.5rem)] overflow-y-auto"
              aria-label="ניווט נייד"
              role="dialog"
              aria-modal="true"
            >
              <div className="grid grid-cols-1 gap-2">
                {links.map((link) => (
                  <NavLink
                    key={link.href}
                    link={link}
                    active={isActive(pathname, link.href)}
                    onClick={closeMobileMenu}
                    variant="menu"
                    guestOnClick={!loggedIn && link.href === '/account' ? openAccountAuth : undefined}
                    forceHub={loggedIn && link.href === '/account'}
                  />
                ))}
              </div>
              {!loggedIn && (
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      openAuthModal({ reason: 'general', initialView: 'login' });
                    }}
                    className="px-4 py-3 rounded-xl text-sm font-bold border-2 border-[#decfa8] bg-white text-[#8b6508]"
                  >
                    התחברות
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      openAuthModal({ reason: 'general', initialView: 'register' });
                    }}
                    className="px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white"
                  >
                    הרשמה חינם
                  </button>
                </div>
              )}
            </nav>
          </>
        )}

        {/* טאבים — מחשב וטאבלט */}
        <nav
          className="hidden md:flex mt-3 gap-1 overflow-x-auto scrollbar-hide bg-[#f7f0de]/80 rounded-t-2xl px-1 lg:px-2 pt-1 border border-b-0 border-[#eadaaf] snap-x snap-mandatory"
          aria-label="ניווט ראשי"
        >
          {links.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              active={isActive(pathname, link.href)}
              variant="tab"
              guestOnClick={!loggedIn && link.href === '/account' ? openAccountAuth : undefined}
              forceHub={loggedIn && link.href === '/account'}
            />
          ))}
        </nav>
        <div className="hidden md:block h-px bg-gradient-to-l from-transparent via-[#d4af37]/60 to-transparent -mt-px" />
      </div>
    </header>
  );
}
