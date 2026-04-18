'use client';

import { AdminLoginModal } from '@/components/admin-login-modal';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  const onAdminNav = useCallback(async () => {
    if (pathname === '/admin') {
      router.push('/admin');
      return;
    }

    try {
      const supabase = createBrowserSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile?.is_admin) {
          router.push('/admin');
          return;
        }
      }
    } catch {
      void 0;
    }
    setAdminLoginOpen(true);
  }, [pathname, router]);

  return (
    <header className="header-sticky">
      <div className="logo-area">
        <div className="logo-bg">
          <Link href="/" className="logo-link" aria-label="Ortiz Ltda — Início">
            <span className="logo-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-construtora-ortiz.png"
                alt="Construtora Ortiz Ltda"
                className="logo-img"
                decoding="async"
                fetchPriority="high"
              />
            </span>
          </Link>
          <span className="slogan">Ortiz Ltda — Tradição e Precisão em Construção de Madeira</span>
        </div>
      </div>
      <nav aria-label="Principal">
        <ul>
          <li>
            <Link href="/" className={pathname === '/' ? 'active' : undefined}>
              Início
            </Link>
          </li>
          <li>
            <Link href="/projetos" className={pathname.startsWith('/projetos') ? 'active' : undefined}>
              Projetos
            </Link>
          </li>
          <li>
            <button type="button" className={pathname.startsWith('/admin') ? 'active' : undefined} onClick={onAdminNav}>
              Admin
            </button>
          </li>
        </ul>
      </nav>
      <AdminLoginModal open={adminLoginOpen} onClose={() => setAdminLoginOpen(false)} />
    </header>
  );
}
