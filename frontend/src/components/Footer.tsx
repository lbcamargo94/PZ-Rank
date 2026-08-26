import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  if (pathname.startsWith('/overlay')) return null;

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span className="site-footer-copy">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </span>
        <span className="site-footer-sep" aria-hidden="true">·</span>
        <span className="site-footer-tag">
          {t('footer.tagline')}
        </span>
        <span className="site-footer-sep" aria-hidden="true">·</span>
        <span className="site-footer-note">
          {t('footer.disclaimer')}
        </span>
        <span className="site-footer-sep" aria-hidden="true">·</span>
        <a
          className="site-footer-contact"
          href="mailto:brasileiraozomboid@gmail.com"
          title={t('footer.contact_title')}
        >
          <i className="ti ti-mail" aria-hidden="true" />
          {t('footer.contact')}
        </a>
      </div>
    </footer>
  );
}
