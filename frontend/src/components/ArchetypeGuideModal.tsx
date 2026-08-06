import { useState, useEffect } from 'react';
import { ARCHETYPE_GUIDE, TAG_GROUPS_INFO } from '../lib/archetype';

type Tab = 'archetypes' | 'tags';

export function ArchetypeGuideModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('archetypes');

  // fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="ag-backdrop" onClick={onClose}>
      <div className="ag-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="ag-header">
          <span className="ag-title">📖 Perfil Psicológico — Guia</span>
          <button className="ag-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {/* Tabs */}
        <div className="ag-tabs">
          <button
            className={`ag-tab${tab === 'archetypes' ? ' active' : ''}`}
            onClick={() => setTab('archetypes')}
          >
            Arquétipos
          </button>
          <button
            className={`ag-tab${tab === 'tags' ? ' active' : ''}`}
            onClick={() => setTab('tags')}
          >
            Conquistas
          </button>
        </div>

        {/* Body */}
        <div className="ag-body">

          {tab === 'archetypes' && (
            <div className="ag-arch-list">
              <p className="ag-intro">
                O arquétipo primário é determinado pela combinação de <strong>habilidades</strong> e
                <strong> comportamento</strong> (stats do mod). O <strong>secundário</strong> aparece quando
                o 2º perfil mais forte atinge ≥&nbsp;70% do 1º.
              </p>
              {ARCHETYPE_GUIDE.map(arch => (
                <div
                  key={arch.id}
                  className="ag-arch-card"
                  style={{ '--arch-color': arch.color } as React.CSSProperties}
                >
                  <div className="ag-arch-card-header">
                    <span className="ag-arch-icon">{arch.icon}</span>
                    <span className="ag-arch-name">{arch.name}</span>
                  </div>
                  <p className="ag-arch-desc">{arch.desc}</p>
                  <div className="ag-arch-reqs">
                    <span className="ag-req-label">Como obter:</span>
                    <ul className="ag-req-list">
                      {arch.how.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  {arch.skills.length > 0 && (
                    <div className="ag-arch-skills">
                      {arch.skills.map(s => (
                        <span key={s} className="ag-skill-chip">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'tags' && (
            <div className="ag-tags-list">
              <p className="ag-intro">
                Até <strong>5 conquistas comportamentais</strong> são exibidas no perfil.
                Dentro de cada grupo, apenas o tier mais alto conquistado é mostrado.
              </p>
              {TAG_GROUPS_INFO.map(group => (
                <div key={group.key} className="ag-tag-group">
                  <span className="ag-tag-group-label">{group.label}</span>
                  <div className="ag-tag-tiers">
                    {group.tiers.map(tier => (
                      <div
                        key={tier.id}
                        className="ag-tag-tier"
                        style={{ '--tier-color': tier.color } as React.CSSProperties}
                      >
                        <span className="ag-tag-tier-icon">{tier.icon}</span>
                        <span className="ag-tag-tier-label">{tier.label}</span>
                        <span className="ag-tag-tier-desc">{tier.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
