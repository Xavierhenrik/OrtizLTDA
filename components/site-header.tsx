'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Cabeçalho global (Início / Projetos / Admin) — alinhado a `public/style.css`. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="header-sticky">
      <div className="logo-area">
        <div className="logo-bg">
          {/* Sem width/height no DOM: só CSS (evita conflito que distorce ao redimensionar). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-ortizltda.png"
            alt="Logo Ortiz Ltda"
            className="logo-img"
            decoding="async"
            fetchPriority="high"
          />
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
            <Link href="/admin" className={pathname.startsWith('/admin') ? 'active' : undefined}>
              Admin
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
