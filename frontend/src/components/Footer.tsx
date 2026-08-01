import { useLocation } from 'react-router-dom';

export function Footer() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/overlay')) return null;

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span className="site-footer-copy">
          &copy; {new Date().getFullYear()} lbcamargo94
        </span>
        <span className="site-footer-sep" aria-hidden="true">·</span>
        <span className="site-footer-tag">
          Projeto pessoal para a comunidade de Project Zomboid
        </span>
        <span className="site-footer-sep" aria-hidden="true">·</span>
        <span className="site-footer-note">
          Não afiliado à The Indie Stone
        </span>
        <span className="site-footer-sep" aria-hidden="true">·</span>
        <a
          className="site-footer-contact"
          href="mailto:brasileiraozomboid@gmail.com"
          title="Parcerias e anúncios"
        >
          <i className="ti ti-mail" aria-hidden="true" />
          Parcerias &amp; Anúncios
        </a>
      </div>
    </footer>
  );
}
