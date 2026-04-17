import { HeroBoot } from '@/components/hero-boot';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <HeroBoot />
      <main id="conteudo-principal" tabIndex={-1}>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Mais do que obras, nós entregamos confiança</h1>
            <p className="hero-subtitle">
              Com madeira, alma e excelência, construímos espaços que duram gerações.
            </p>
            <div className="botoes-hero">
              <a
                href="https://wa.me/554999928749"
                className="btn-ortiz-outline btn-ortiz-hero"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fa fa-comments" aria-hidden /> Fale Conosco
              </a>
              <Link href="/projetos" className="btn-ortiz-outline btn-ortiz-hero">
                <i className="fa fa-briefcase" aria-hidden /> Ver Projetos
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
