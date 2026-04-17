import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#conteudo-principal" className="skip-to-content">
        Pular para o conteúdo principal
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
