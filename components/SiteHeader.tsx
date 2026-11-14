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
  { href: '/', label: 'קטלוג' },
  { href: '/account', label: 'האזור שלי' },
  { href: '/how-it-works', label: 'איך זה עובד' },
  { href: '/terms', label: 'תקנון' },
  { href: '/privacy', label: 'פרטיות' },
  { href: '/contact', label: 'צור קשר' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h1.6l1.2 9.2a2 2 0 0 0 2 1.8h8.5a2 2 0 0 0 2-1.6L21 8H7" />
      <circle cx="9.2" cy="19.2" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17.2" cy="19.2" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20s-7-4.35-7-9.2A4.1 4.1 0 0 1 12 7.4 4.1 4.1 0 0 1 19 10.8C19 15.65 12 20 12 20z"
      />
    </svg>
  );
}

function NavLink({
  link,
  active,
  onClick,
  variant = 'bar',
  guestOnClick,
  forceHub,
  overlay = false,
}: {
  link: (typeof links)[number];
  active: boolean;
  onClick?: () => void;
  variant?: 'bar' | 'menu';
  guestOnClick?: () => void;
  forceHub?: boolean;
  overlay?: boolean;
}) {
  const className =
    variant === 'menu'
      ? `block rounded-xl px-4 py-3 text-sm font-bold ${
          active ? 'bg-[#f6eef1] text-[#6b2340]' : 'text-[#2c2426] hover:bg-[#faf7f5]'
        }`
      : `relative py-1 text-[13px] font-semibold tracking-wide transition-colors ${
          overlay
            ? active
              ? 'text-white'
              : 'text-white/80 hover:text-white'
            : active
              ? 'text-[#6b2340]'
              : 'text-[#4a3d41] hover:text-[#6b2340]'
        }`;

  const label = (
    <>
      {link.label}
      {variant === 'bar' && active && (
        <span className={`absolute -bottom-2 right-0 left-0 h-px ${overlay ? 'bg-white' : 'bg-[#6b2340]'}`} />
      )}
    </>
  );

  if (forceHub) {
    return (
      <button
        type="button"
        onClick={() => {
          navigateAccountHub();
          onClick?.();
        }}
        className={className}
      >
        {label}
      </button>
    );
  }

  if (guestOnClick) {
    return (
      <button
        type="button"
        onClick={() => {
          guestOnClick();
          onClick?.();
        }}
        className={className}
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={link.href} onClick={onClick} className={className}>
      {label}
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
  const overlay = false;

  const closeMobileMenu = () => setMobileOpen(false);
  const openAccountAuth = () => openAuthModal({ reason: 'account', next: '/account' });
  const openCartAuth = () => openAuthModal({ reason: 'cart', next: '/account?section=cart' });
  const openFavAuth = () => openAuthModal({ reason: 'favorites', next: '/account?section=favorites' });

  const iconBtn = overlay
    ? 'relative inline-flex h-10 items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors'
    : 'relative inline-flex h-10 items-center gap-1.5 rounded-full border border-[#ead8dc] bg-white px-3 text-[11px] font-semibold text-[#6b2340] hover:border-[#6b2340] transition-colors';

  const countBadge = overlay
    ? 'absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#6b2340]'
    : 'absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6b2340] px-1 text-[10px] font-bold text-white';

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
    <>
    <header
      className={`fixed top-0 z-30 w-full max-w-[100vw] transition-all duration-300 ${
        overlay
          ? 'border-transparent bg-gradient-to-b from-black/35 to-transparent'
          : 'border-b border-[#ead8dc] bg-white/95 shadow-sm backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <img src="/logo.svg?v=8" alt="" className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <div className="min-w-0">
            <span
              className={`block truncate font-[family-name:var(--font-luxury)] text-lg leading-none sm:text-xl ${
                overlay ? 'text-white' : 'text-[#2c2426]'
              }`}
            >
              {SITE_NAME}
            </span>
            {userName && (
              <span className={`mt-1 block truncate text-[11px] ${overlay ? 'text-white/70' : 'text-[#7a5e64]'}`}>
                שלום, {userName}
              </span>
            )}
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex lg:gap-7" aria-label="ניווט ראשי">
          {links.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              active={isActive(pathname, link.href)}
              overlay={overlay}
              guestOnClick={!loggedIn && link.href === '/account' ? openAccountAuth : undefined}
              forceHub={loggedIn && link.href === '/account'}
            />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!loggedIn && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => openAuthModal({ reason: 'general', initialView: 'login' })}
                className={`rounded-full border px-3 py-2 text-[12px] font-bold ${
                  overlay
                    ? 'border-white text-white hover:bg-white/15'
                    : 'border-[#6b2340] text-[#6b2340] hover:bg-[#f6eef1]'
                }`}
              >
                התחברות
              </button>
              <button
                type="button"
                onClick={() => openAuthModal({ reason: 'general', initialView: 'register' })}
                className={`rounded-full px-3.5 py-2 text-[12px] font-bold ${
                  overlay ? 'bg-white text-[#6b2340] hover:bg-[#f6eef1]' : 'bg-[#6b2340] text-white hover:bg-[#4a152c]'
                }`}
              >
                הרשמה
              </button>
            </div>
          )}
          {loggedIn ? (
            <Link href="/account?section=cart" className={iconBtn} aria-label="סל קניות">
              <CartIcon />
              <span>סל קניות</span>
              {cartCount > 0 && <span className={countBadge}>{cartCount}</span>}
            </Link>
          ) : (
            <button type="button" onClick={openCartAuth} className={iconBtn} aria-label="סל קניות">
              <CartIcon />
              <span>סל קניות</span>
            </button>
          )}
          {loggedIn ? (
            <Link href="/account?section=favorites" className={iconBtn} aria-label="מועדפים">
              <HeartIcon />
              <span>מועדפים</span>
              {favCount > 0 && <span className={countBadge}>{favCount}</span>}
            </Link>
          ) : (
            <button type="button" onClick={openFavAuth} className={iconBtn} aria-label="מועדפים">
              <HeartIcon />
              <span>מועדפים</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${
              overlay ? 'border-white/40 text-white' : 'border-[#ead8dc] text-[#6b2340]'
            }`}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-[3.6rem] z-[90] bg-black/25 md:hidden"
            aria-label="סגירת תפריט"
            onClick={closeMobileMenu}
          />
          <nav
            className="fixed inset-x-0 top-[3.6rem] z-[100] max-h-[calc(100dvh-3.6rem)] overflow-y-auto border-b border-[#ead8dc] bg-white px-3 py-3 shadow-xl md:hidden"
            aria-label="ניווט נייד"
            role="dialog"
            aria-modal="true"
          >
            <div className="grid gap-1">
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
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    openAuthModal({ reason: 'general', initialView: 'login' });
                  }}
                  className="rounded-xl border border-[#6b2340] px-4 py-3 text-sm font-bold text-[#6b2340]"
                >
                  התחברות
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    openAuthModal({ reason: 'general', initialView: 'register' });
                  }}
                  className="rounded-xl bg-[#6b2340] px-4 py-3 text-sm font-bold text-white"
                >
                  הרשמה
                </button>
              </div>
            )}
          </nav>
        </>
      )}
    </header>
    {!overlay && <div className="h-[3.85rem] sm:h-[4.15rem]" aria-hidden />}
    </>
  );
}
