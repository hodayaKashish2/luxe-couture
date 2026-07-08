'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC = ['/login', '/register'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isPublic =
      PUBLIC.includes(pathname) ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api/');

    if (isPublic) {
      setReady(true);
      return;
    }

    const token = sessionStorage.getItem('site_token');
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fbf8f0] to-[#e8dcbd]">
        <p className="text-sm text-[#8b6508] font-bold animate-pulse">טוען...</p>
      </div>
    );
  }

  return <>{children}</>;
}
