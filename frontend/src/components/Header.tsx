import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onPainel:   () => void;
  onRules:    () => void;
  onSettings: () => void;
}

function readPlayerSession(): { nick: string; player_id: number } | null {
  try {
    const raw = sessionStorage.getItem('player_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function Header({ onPainel, onRules, onSettings }: HeaderProps) {
  const [playerSession] = useState(readPlayerSession);
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-brand" aria-label="Página inicial" onClick={close}>
          <span className="game-label">Project Zomboid</span>
          <h1 className="site-title">Ranking de Sobrevivência</h1>
          <div className="site-sub-row">
            <p className="site-sub">Desafio BRASILEIRÃO PZ</p>
            <span className="season-chip">Temporada 1</span>
          </div>
          <p className="site-tagline">Sobreviva. Evolua. Supere.</p>
        </Link>

        <button
          className="header-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
        </button>
      </div>

      <nav className={`site-nav${menuOpen ? ' site-nav-open' : ''}`} aria-label="Navegação principal">
        <div className="container site-nav-inner">
          <button className="nav-item" onClick={() => { onRules(); close(); }}>
            <i className="ti ti-book" aria-hidden="true" /> Regras
          </button>
          <Link to="/wiki" className="nav-item" onClick={close}>
            <i className="ti ti-book-2" aria-hidden="true" /> Wiki
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
          <button className="nav-item" onClick={() => { onSettings(); close(); }}>
            <i className="ti ti-settings" aria-hidden="true" /> Configurações
          </button>
          <Link
            to="/minha-conta"
            className={`nav-item${playerSession ? ' nav-item-logged' : ''}`}
            onClick={close}
          >
            <i className={`ti ${playerSession ? 'ti-user-filled' : 'ti-user-circle'}`} aria-hidden="true" />
            {playerSession ? playerSession.nick : 'Minha Conta'}
          </Link>
          <button className="nav-item nav-item-mod" onClick={() => { onPainel(); close(); }}>
            <i className="ti ti-shield-half" aria-hidden="true" /> Moderadores
          </button>
        </div>

      </nav>
    </header>
  );
}
