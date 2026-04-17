import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin — Ortiz Ltda',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#conteudo-principal" className="skip-to-content">
        Pular para o conteúdo principal
      </a>
      <aside className="admin-mobile-notice" role="status" aria-live="polite">
        <p className="admin-mobile-notice__text">
          <i className="fas fa-desktop admin-mobile-notice__icon" aria-hidden />
          <span>
            <strong>Experiência completa.</strong> Para revisar galerias e editar projetos com mais espaço na tela,
            recomendamos abrir o painel no computador ou em tablet.
          </span>
        </p>
      </aside>
      {children}
    </>
  );
}
