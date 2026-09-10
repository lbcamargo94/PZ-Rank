import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pzrankLogo from '../../assets/logo/pzrank-logo.webp';
import { COMPANION_TAG } from '../lib/companion';
import { NAV_ITEMS } from '../lib/nav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThanksCelebration } from './ThanksCelebration';

interface HeaderProps {
  onPainel: () => void;
}

function readPlayerSession(): { nick: string; player_id: number } | null {
  try {
    const raw = localStorage.getItem('player_session') || sessionStorage.getItem('player_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function Header({ onPainel }: HeaderProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [playerSession] = useState(readPlayerSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef   = useRef<HTMLElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  const close = () => setMenuOpen(false);

  useEffect(() => {
    const onKey     = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onOutside = (e: MouseEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [menuOpen]);

  const active = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  const navLink = (to: string, icon: string, label: string) => (
    <Link
      to={to}
      className={`nav-item${active(to) ? ' nav-item-active' : ''}`}
      aria-current={active(to) ? 'page' : undefined}
      title={label}
      onClick={close}
    >
      <i className={`ti ${icon}`} aria-hidden="true" />
      <span className="nav-item-label">{label}</span>
    </Link>
  );

  return (
    <header className="site-header">
      <div className="container header-inner">

        <Link to="/" className="header-brand" aria-label={t('header.home_aria')} onClick={close}>
          <img src={pzrankLogo} alt="PZ Rank" className="header-logo" />
        </Link>

        <nav
          ref={navRef}
          id="site-nav"
          className={`site-nav${menuOpen ? ' site-nav-open' : ''}`}
          aria-label={t('header.nav_aria')}
        >
          {NAV_ITEMS.map(item => navLink(item.to, item.icon, t(`nav.${item.navKey}`)))}

          {/* Itens exclusivos do menu mobile */}
          <div className="site-nav-divider nav-mobile-only" aria-hidden="true" />
          <Link
            to={playerSession ? '/perfil' : '/login'}
            className={`nav-item nav-mobile-only${playerSession ? ' nav-item-logged' : ''}`}
            aria-current={active('/perfil') || active('/login') ? 'page' : undefined}
            onClick={close}
          >
            <i className={`ti ${playerSession ? 'ti-user-filled' : 'ti-user-circle'}`} aria-hidden="true" />
            {playerSession ? playerSession.nick : t('header.login')}
          </Link>
          <button className="nav-item nav-item-mod nav-mobile-only" onClick={() => { onPainel(); close(); }}>
            <i className="ti ti-shield-half" aria-hidden="true" /> {t('nav.moderators')}
          </button>
        </nav>

        <div className="header-right">
          <ThanksCelebration />
          <LanguageSwitcher />

          <div className="header-auth">
            {/* Companion visível só no mobile (no desktop usa o link /links do nav) */}
            <Link to="/links" className="btn-header btn-header-companion nav-mobile-only" title={t('header.download_companion_title')}>
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
            ref={btnRef}
            className={`header-hamburger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? t('header.menu_close') : t('header.menu_open')}
            aria-expanded={menuOpen}
            aria-controls="site-nav"
          >
            <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
          </button>
        </div>

      </div>
    </header>
  );
}
