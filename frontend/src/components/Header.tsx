import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [playerSession] = useState(readPlayerSession);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-brand" aria-label="Página inicial">
          <span className="game-label">Project Zomboid</span>
          <h1 className="site-title">Ranking de Sobrevivência</h1>
          <div className="site-sub-row">
            <p className="site-sub">Desafio BRASILEIRÃO PZ</p>
            <span className="season-chip">Temporada 1</span>
          </div>
        </Link>
        <div className="header-actions">
          <button className="btn-primary btn-sm" onClick={onRules} aria-label="Regras do desafio">
            <i className="ti ti-book" aria-hidden="true" /> Regras
          </button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/wiki')} aria-label="Wiki de receitas">
            <i className="ti ti-book-2" aria-hidden="true" /> Wiki
          </button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/mods')} aria-label="Mods permitidos">
            <i className="ti ti-puzzle" aria-hidden="true" /> Mods
          </button>
<button className="btn-primary btn-sm" onClick={onSettings} aria-label="Configurações do desafio">
            <i className="ti ti-settings" aria-hidden="true" /> Configurações
          </button>
          <Link
            to="/minha-conta"
            className={`btn-primary btn-sm${playerSession ? ' header-account-logged' : ''}`}
            aria-label="Minha conta"
          >
            <i className={`ti ${playerSession ? 'ti-user-filled' : 'ti-user-circle'}`} aria-hidden="true" />
            {playerSession
              ? <span className="header-account-nick">{playerSession.nick}</span>
              : 'Minha Conta'
            }
          </Link>
          <button className="btn-primary btn-sm" onClick={onPainel} aria-label="Painel de moderadores">
            <i className="ti ti-shield-half" aria-hidden="true" /> Moderadores
          </button>
        </div>
      </div>
      <div className="container rules-bar">
        <span className="rule-tag"><i className="ti ti-skull" aria-hidden="true" /> Stats do mod</span>
        <span className="rule-tag"><i className="ti ti-calendar" aria-hidden="true" /> Tempo, dias, zumbis</span>
        <span className="rule-tag"><i className="ti ti-settings" aria-hidden="true" /> Sandbox validado</span>
        <span className="rule-tag"><i className="ti ti-mail-check" aria-hidden="true" /> Email verificado</span>
      </div>
    </header>
  );
}
