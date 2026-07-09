'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthModal } from '@/components/AuthModalProvider';

const PROTECTED_PREFIXES = ['/account'];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const promptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!needsAuth(pathname)) return;

    const token = sessionStorage.getItem('site_token');
    if (token) {
      promptedRef.current = null;
      return;
    }

    if (promptedRef.current === pathname) return;
    promptedRef.current = pathname;

    const next =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : pathname;

    openAuthModal({ reason: 'account', next });
  }, [pathname, openAuthModal]);

  return <>{children}</>;
}
