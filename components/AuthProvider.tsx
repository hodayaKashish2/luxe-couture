'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginUrl } from '@/lib/require-login';

const PROTECTED_PREFIXES = ['/account'];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(() => !needsAuth(pathname));

  useEffect(() => {
    if (!needsAuth(pathname)) {
      setReady(true);
      return;
    }

    const token = sessionStorage.getItem('site_token');
    if (!token) {
      router.replace(loginUrl(pathname));
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <p className="text-[#8b6508] text-sm">טוען...</p>
      </div>
    );
  }

  return <>{children}</>;
}
