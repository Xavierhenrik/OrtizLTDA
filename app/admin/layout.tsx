import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin — Ortiz Ltda',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <aside className="admin-mobile-notice" role="status" aria-live="polite">
        <p className="admin-mobile-notice__text">
          <i className="fas fa-desktop admin-mobile-notice__icon" aria-hidden />
          <span>
            <strong>Uso recomendado no computador.</strong> O painel administrativo não foi otimizado para telas
            pequenas; em celular o layout pode ficar apertado ou difícil de usar.
          </span>
        </p>
      </aside>
      {children}
    </>
  );
}
