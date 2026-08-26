import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pzrankLogo from '../../assets/logo/pzrank-logo.png';
import { COMPANION_TAG } from '../lib/companion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThanksCelebration } from './ThanksCelebration';

interface HeaderProps {
  onPainel: () => void;
}

function readPlayerSession(): { nick: string; player_id: number } | null {
  try {
    const raw = sessionStorage.getItem('player_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function Header({ onPainel }: HeaderProps) {
  const { t } = useTranslation();
  const [playerSession] = useState(readPlayerSession);
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">

        <Link to="/" className="header-brand" aria-label={t('header.home_aria')} onClick={close}>
          <img src={pzrankLogo} alt="PZ Rank" className="header-logo" />
          <span className="header-subtitle">{t('header.tagline')}</span>
        </Link>

        <div className="header-right">
          <ThanksCelebration />
          <LanguageSwitcher />

          <div className="header-auth">
            <Link to="/links" className="btn-header btn-header-companion" title={t('header.download_companion_title')}>
              <i className="ti ti-download" aria-hidden="true" />
              <span className="btn-header-companion-text">{t('header.companion')} {COMPANION_TAG}</span>
            </Link>

            {playerSession ? (
              <Link to="/perfil" className="btn-header btn-header-account" onClick={close}>
                <i className="ti ti-user-filled" aria-hidden="true" />
                <span className="btn-header-nick">{playerSession.nick}</span>
              </Link>
            ) : (
              <>
                <Link to="/cadastrar-conta" className="btn-header btn-header-register" onClick={close}>
                  <i className="ti ti-user-plus" aria-hidden="true" />
                  <span className="btn-header-register-text">{t('header.register')}</span>
                </Link>
                <Link to="/login" className="btn-header btn-header-login" onClick={close}>
                  {t('header.login')}
                </Link>
              </>
            )}
          </div>

          <button
            className={`header-hamburger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? t('header.menu_close') : t('header.menu_open')}
            aria-expanded={menuOpen}
          >
            <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav className={`site-nav${menuOpen ? ' site-nav-open' : ''}`} aria-label={t('header.nav_aria')}>
        <div className="container site-nav-inner">
          <Link to="/rank" className="nav-item" onClick={close}>
            <i className="ti ti-trophy" aria-hidden="true" /> {t('nav.rank')}
          </Link>
          <Link to="/regras" className="nav-item" onClick={close}>
            <i className="ti ti-book" aria-hidden="true" /> {t('nav.rules')}
          </Link>
          <Link to="/wiki" className="nav-item" onClick={close}>
            <i className="ti ti-book-2" aria-hidden="true" /> {t('nav.wiki')}
          </Link>
          <Link to="/links" className="nav-item" onClick={close}>
            <i className="ti ti-link" aria-hidden="true" /> {t('nav.links')}
          </Link>
          <Link to="/mods" className="nav-item" onClick={close}>
            <i className="ti ti-puzzle" aria-hidden="true" /> {t('nav.mods')}
          </Link>
          <Link to="/lendas" className="nav-item" onClick={close}>
            <i className="ti ti-award" aria-hidden="true" /> {t('nav.legends')}
          </Link>
          <Link to="/transparencia" className="nav-item" onClick={close}>
            <i className="ti ti-chart-pie" aria-hidden="true" /> {t('nav.transparency')}
          </Link>
          <Link to="/regras#sandbox" className="nav-item" onClick={close}>
            <i className="ti ti-settings" aria-hidden="true" /> {t('nav.settings')}
          </Link>
          <div className="site-nav-divider" />
          <Link
            to={playerSession ? '/perfil' : '/login'}
            className={`nav-item${playerSession ? ' nav-item-logged' : ''}`}
            onClick={close}
          >
            <i className={`ti ${playerSession ? 'ti-user-filled' : 'ti-user-circle'}`} aria-hidden="true" />
            {playerSession ? playerSession.nick : t('header.login')}
          </Link>
          <button className="nav-item nav-item-mod" onClick={() => { onPainel(); close(); }}>
            <i className="ti ti-shield-half" aria-hidden="true" /> {t('nav.moderators')}
          </button>
        </div>
      </nav>
    </header>
  );
}
