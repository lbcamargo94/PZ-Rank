import { useState } from 'react';
import { Link } from 'react-router-dom';
import pzrankLogo from '../../assets/logo/pzrank-logo.png';

const COMPANION_URL = 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/download/v1.8.3/PZ.Rank.Companion.Setup.1.8.2.exe';
const COMPANION_VER = 'v1.8.3';

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
  const [playerSession] = useState(readPlayerSession);
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">

        <Link to="/" className="header-brand" aria-label="PZ Rank — Página inicial" onClick={close}>
          <img src={pzrankLogo} alt="PZ Rank" className="header-logo" />
          <span className="header-subtitle">Campeonato Brasileiro PZ</span>
        </Link>

        <div className="header-right">
          <div className="header-auth">
            <a href={COMPANION_URL} className="btn-header btn-header-companion" download title="Baixar PZ Rank Companion">
              <i className="ti ti-download" aria-hidden="true" />
              <span className="btn-header-companion-text">Companion {COMPANION_VER}</span>
            </a>

            {playerSession ? (
              <Link to="/perfil" className="btn-header btn-header-account" onClick={close}>
                <i className="ti ti-user-filled" aria-hidden="true" />
                <span className="btn-header-nick">{playerSession.nick}</span>
              </Link>
            ) : (
              <>
                <Link to="/cadastrar-conta" className="btn-header btn-header-register" onClick={close}>
                  <i className="ti ti-user-plus" aria-hidden="true" />
                  <span className="btn-header-register-text">Cadastre-se</span>
                </Link>
                <Link to="/login" className="btn-header btn-header-login" onClick={close}>
                  Login
                </Link>
              </>
            )}
          </div>

          <button
            className={`header-hamburger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav className={`site-nav${menuOpen ? ' site-nav-open' : ''}`} aria-label="Navegação principal">
        <div className="container site-nav-inner">
          <Link to="/rank" className="nav-item" onClick={close}>
            <i className="ti ti-trophy" aria-hidden="true" /> Rank
          </Link>
          <Link to="/regras" className="nav-item" onClick={close}>
            <i className="ti ti-book" aria-hidden="true" /> Regras
          </Link>
          <Link to="/wiki" className="nav-item" onClick={close}>
            <i className="ti ti-book-2" aria-hidden="true" /> Wiki
          </Link>
          <Link to="/links" className="nav-item" onClick={close}>
            <i className="ti ti-link" aria-hidden="true" /> Links Úteis
          </Link>
          <Link to="/mods" className="nav-item" onClick={close}>
            <i className="ti ti-puzzle" aria-hidden="true" /> Mods
          </Link>
          <Link to="/lendas" className="nav-item" onClick={close}>
            <i className="ti ti-award" aria-hidden="true" /> Lendas
          </Link>
          <Link to="/transparencia" className="nav-item" onClick={close}>
            <i className="ti ti-chart-pie" aria-hidden="true" /> Transparência
          </Link>
          <Link to="/regras#sandbox" className="nav-item" onClick={close}>
            <i className="ti ti-settings" aria-hidden="true" /> Configurações
          </Link>
          <div className="site-nav-divider" />
          <Link
            to={playerSession ? '/perfil' : '/login'}
            className={`nav-item${playerSession ? ' nav-item-logged' : ''}`}
            onClick={close}
          >
            <i className={`ti ${playerSession ? 'ti-user-filled' : 'ti-user-circle'}`} aria-hidden="true" />
            {playerSession ? playerSession.nick : 'Login'}
          </Link>
          <button className="nav-item nav-item-mod" onClick={() => { onPainel(); close(); }}>
            <i className="ti ti-shield-half" aria-hidden="true" /> Moderadores
          </button>
        </div>
      </nav>
    </header>
  );
}
