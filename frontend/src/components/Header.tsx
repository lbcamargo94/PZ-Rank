import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pzrankLogo from '../../assets/logo/pzrank-logo.webp';
import { COMPANION_TAG } from '../lib/companion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThanksCelebration } from './ThanksCelebration';
import { NavDrawer } from './NavDrawer';

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const close = () => setDrawerOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">

        <Link to="/" className="header-brand" aria-label={t('header.home_aria')} onClick={close}>
          <img src={pzrankLogo} alt="PZ Rank" className="header-logo" />
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
              <Link to="/perfil" className="btn-header btn-header-account">
                <i className="ti ti-user-filled" aria-hidden="true" />
                <span className="btn-header-nick">{playerSession.nick}</span>
              </Link>
            ) : (
              <>
                <Link to="/cadastrar-conta" className="btn-header btn-header-register">
                  <i className="ti ti-user-plus" aria-hidden="true" />
                  <span className="btn-header-register-text">{t('header.register')}</span>
                </Link>
                <Link to="/login" className="btn-header btn-header-login">
                  {t('header.login')}
                </Link>
              </>
            )}
          </div>

          <button
            className="header-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('header.menu_open')}
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
          >
            <i className="ti ti-menu-2" aria-hidden="true" />
          </button>
        </div>

      </div>

      <NavDrawer
        open={drawerOpen}
        onClose={close}
        pathname={pathname}
        playerSession={playerSession}
        onPainel={onPainel}
      />
    </header>
  );
}
