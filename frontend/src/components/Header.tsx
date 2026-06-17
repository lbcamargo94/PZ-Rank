interface HeaderProps {
  onPainel: () => void;
}

export function Header({ onPainel }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div>
          <span className="game-label">Project Zomboid</span>
          <h1 className="site-title">Ranking de Sobrevivência</h1>
          <p className="site-sub">// desafio da comunidade — quem dura mais?</p>
        </div>
        <div className="header-actions">
          <button className="btn-ghost btn-sm" onClick={onPainel} aria-label="Painel de moderadores">
            <i className="ti ti-shield-half" aria-hidden="true" /> Moderadores
          </button>
        </div>
      </div>
      <div className="container rules-bar">
        <span className="rule-tag"><i className="ti ti-link" aria-hidden="true" /> Link da live</span>
        <span className="rule-tag"><i className="ti ti-skull" aria-hidden="true" /> Stats do mod</span>
        <span className="rule-tag"><i className="ti ti-calendar" aria-hidden="true" /> Tempo, dias, zumbis</span>
        <span className="rule-tag"><i className="ti ti-user-check" aria-hidden="true" /> Aprovado por moderador</span>
      </div>
    </header>
  );
}
