import { Link } from 'react-router-dom';

interface HeaderProps {
  onPainel:   () => void;
  onRules:    () => void;
  onSettings: () => void;
}

export function Header({ onPainel, onRules, onSettings }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-brand" aria-label="Página inicial">
          <span className="game-label">Project Zomboid</span>
          <h1 className="site-title">Ranking de Sobrevivência</h1>
          <p className="site-sub">Desafio BRASILEIRÃO PZ</p>
        </Link>
        <div className="header-actions">
          <button className="btn-primary btn-sm" onClick={onRules} aria-label="Regras do desafio">
            <i className="ti ti-book" aria-hidden="true" /> Regras
          </button>
          <button className="btn-primary btn-sm" onClick={onSettings} aria-label="Configurações do desafio">
            <i className="ti ti-settings" aria-hidden="true" /> Configurações
          </button>
          <button className="btn-primary btn-sm" onClick={onPainel} aria-label="Painel de moderadores">
            <i className="ti ti-shield-half" aria-hidden="true" /> Moderadores
          </button>
        </div>
      </div>
      <div className="container rules-bar">
        <span className="rule-tag"><i className="ti ti-skull" aria-hidden="true" /> Stats do mod</span>
        <span className="rule-tag"><i className="ti ti-calendar" aria-hidden="true" /> Tempo, dias, zumbis</span>
        <span className="rule-tag"><i className="ti ti-settings" aria-hidden="true" /> Sandbox validado</span>
        <span className="rule-tag"><i className="ti ti-user-check" aria-hidden="true" /> Aprovado por moderador</span>
      </div>
    </header>
  );
}
