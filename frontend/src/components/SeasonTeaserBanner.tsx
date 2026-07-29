import { useState } from 'react';

const SESSION_KEY = 'season_teaser_dismissed';

export function SeasonTeaserBanner() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  return (
    <div className="season-teaser" role="status">
      <div className="container season-teaser-inner">
        <span className="season-teaser-icon" aria-hidden="true">🏆</span>
        <div className="season-teaser-text">
          <strong className="season-teaser-title">Nova temporada em preparação</strong>
          <span className="season-teaser-sub">
            Em breve: conquistas, divisões, Hall da Fama e muito mais.
            Fique de olho nos canais da comunidade.
          </span>
        </div>
        <button
          className="season-teaser-close"
          onClick={dismiss}
          aria-label="Fechar aviso"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
