import { useState } from 'react';

const SESSION_KEY = 'season1_overlay_dismissed';

export function SeasonEndOverlay() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  return (
    <div className="seo-backdrop" role="dialog" aria-modal="true" aria-label="Temporada encerrada">
      <div className="seo-card">
        <div className="seo-top-bar" />

        <div className="seo-skull" aria-hidden="true">☠️</div>

        <p className="seo-eyebrow">Brasileirão PZ</p>
        <h1 className="seo-title">TEMPORADA 1</h1>
        <p className="seo-status">EM BREVE</p>

        <div className="seo-divider" />

        <p className="seo-body">
          O site está em reforma.<br />
          Grandes mudanças estão chegando — reset do rank,<br />
          novas funcionalidades e uma temporada oficial.
        </p>

        <p className="seo-coming">
          🔧 <strong>Fique de olho nos canais da comunidade</strong> para saber quando abriremos.
        </p>

        <button className="seo-btn" onClick={dismiss}>
          Ir Para o Site
        </button>
      </div>
    </div>
  );
}
