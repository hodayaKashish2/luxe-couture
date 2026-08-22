'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthModal } from '@/components/AuthModalProvider';
import { isAuthDismissed } from '@/lib/auth-dismiss';
import { getSiteToken } from '@/lib/site-session';

const PROTECTED_PREFIXES = ['/account'];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const promptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!needsAuth(pathname)) return;

    const token = getSiteToken();
    if (token) {
      promptedRef.current = null;
      return;
    }

    if (isAuthDismissed()) {
      router.replace('/', { scroll: false });
      return;
    }

    if (promptedRef.current === pathname) return;
    promptedRef.current = pathname;

    const next = pathname.startsWith('/account')
      ? `${pathname}${window.location.search}`
      : `${pathname}${window.location.search}`;

    openAuthModal({ reason: 'account', next, skipUrl: true });
  }, [pathname, openAuthModal, router]);

  return <>{children}</>;
}
