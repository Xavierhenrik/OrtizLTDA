export function SiteFooter() {
  return (
    <footer>
      <div className="footer-content">
        <span>
          &copy; {new Date().getFullYear()} Ortiz Ltda - Tradição e Precisão em Construção de Madeira a mais de 45 anos
        </span>
        <div className="footer-info">
          <span>
            <i className="fa fa-map-marker-alt" aria-hidden /> Atendemos toda a cidade de Lages e região
          </span>
          <span>
            <i className="fa fa-phone" aria-hidden /> (49) 9992-8749
          </span>
          <span>
            <i className="fa fa-envelope" aria-hidden />{' '}
            <a href="mailto:ConstrutoraortizLtda@gmail.com">ConstrutoraortizLtda@gmail.com</a>
          </span>
        </div>
        <div className="footer-social">
          <a
            href="https://www.instagram.com/construtoraortizltda?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            aria-label="Instagram da Ortiz Ltda (abre em nova aba)"
            title="Instagram"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fab fa-instagram" aria-hidden />
          </a>
          <a
            href="https://wa.me/554999928749"
            aria-label="WhatsApp da Ortiz Ltda (abre em nova aba)"
            title="WhatsApp"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fab fa-whatsapp" aria-hidden />
          </a>
        </div>

        <div className="footer-credit" aria-label="Site desenvolvido por BX Tecnologia">
          <div className="footer-credit-inner">
            <span className="footer-credit-prefix">Soluções digitais por</span>
            <div className="footer-credit-brand">
              <span className="logo-mark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bx-tecnologia-logo.png"
                  alt=""
                  className="logo-img logo-img--bx-footer"
                  decoding="async"
                  loading="lazy"
                />
              </span>
              <span className="footer-credit-name">BX Tecnologia</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
