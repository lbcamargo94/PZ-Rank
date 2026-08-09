import { useState, useEffect } from 'react';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS_PER_KILL, SCORE_KILLS_MAX,
  SCORE_SKILL_10, SCORE_SPIFFO_DONE, SCORE_MILITARY,
  SCORE_SPIFFO_HQ, SCORE_SPIFFO_RELIC, MAX_POSSIBLE_SCORE,
} from '../lib/objectives';

interface Props {
  onClose: () => void;
}

type Tab = 'objectives' | 'bases' | 'score';

export function RulesModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('objectives');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box rules-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        {/* ── Header ── */}
        <div className="rules-modal-header">
          <div className="rules-modal-icon"><i className="ti ti-shield-star" /></div>
          <h2 className="modal-title">Regras do Desafio</h2>
          <p className="rules-modal-sub">
            Sobreviva o máximo possível e complete objetivos para acumular pontos.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="rules-tabs">
          <button className={`rules-tab${tab === 'objectives' ? ' active' : ''}`} onClick={() => setTab('objectives')}>
            <i className="ti ti-target" /> Objetivos
          </button>
          <button className={`rules-tab${tab === 'bases' ? ' active' : ''}`} onClick={() => setTab('bases')}>
            <i className="ti ti-building-store" /> Bases Spiffo's
          </button>
          <button className={`rules-tab${tab === 'score' ? ' active' : ''}`} onClick={() => setTab('score')}>
            <i className="ti ti-calculator" /> Pontuação
          </button>
        </div>

        <div className="rules-tab-body">

          {/* ── Aba Objetivos ── */}
          {tab === 'objectives' && (
            <div className="rules-section-list">

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-skull" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Zumbis Abatidos</span>
                  <span className="rules-obj-desc">
                    Cada zumbi abatido vale <strong>{SCORE_KILLS_PER_KILL} pt</strong>.
                    Máximo contabilizado: {SCORE_KILLS_MAX.toLocaleString('pt-BR')} zumbis.
                  </span>
                  <span className="rules-pts-badge">até {Math.round(SCORE_KILLS_MAX * SCORE_KILLS_PER_KILL).toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-star" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Habilidades no Nível 10</span>
                  <span className="rules-obj-desc">
                    Cada habilidade maximizada ao nível 10 vale <strong>+{SCORE_SKILL_10.toLocaleString('pt-BR')} pts</strong>.
                    O jogo conta com 35 habilidades no total.
                  </span>
                  <span className="rules-pts-badge">até {(35 * SCORE_SKILL_10).toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card rules-obj-card-wide">
                <div className="rules-obj-icon"><i className="ti ti-building-store" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Bases nos Restaurantes Spiffo's</span>
                  <span className="rules-obj-desc">
                    Estabeleça uma base em cada um dos {SPIFFOS_RESTAURANTS.length} restaurantes Spiffo's no mapa.
                    Cada base estabelecida vale <strong>+{SCORE_SPIFFO_DONE.toLocaleString('pt-BR')} pts</strong>.
                  </span>
                  <button className="rules-tab-link" onClick={() => setTab('bases')}>
                    Ver todos os restaurantes <i className="ti ti-arrow-right" />
                  </button>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-building-store" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Sede do Spiffo's (Louisville HQ)</span>
                  <span className="rules-obj-desc">
                    Conquiste a sede central do Spiffo's em Louisville.
                  </span>
                  <span className="rules-pts-badge">+{SCORE_SPIFFO_HQ.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-trophy" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Relíquia do Spiffo</span>
                  <span className="rules-obj-desc">
                    Encontre e colete a lendária Relíquia do Spiffo.
                  </span>
                  <span className="rules-pts-badge">+{SCORE_SPIFFO_RELIC.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-sword" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Base Militar de Rosewood</span>
                  <span className="rules-obj-desc">
                    Conquiste completamente a base militar secreta de Rosewood.
                  </span>
                  <span className="rules-pts-badge">+{SCORE_MILITARY.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

            </div>
          )}

          {/* ── Aba Bases Spiffo's ── */}
          {tab === 'bases' && (
            <div className="rules-bases-section">
              <p className="rules-bases-intro">
                Estabeleça uma base em cada restaurante. Cada base estabelecida vale{' '}
                <strong>+{SCORE_SPIFFO_DONE.toLocaleString('pt-BR')} pts</strong>. Os itens abaixo são os requisitos para validar a base:
              </p>

              <div className="rules-base-items-list">
                {BASE_ITEMS.map(item => (
                  <div key={item.id} className="rules-base-item-row">
                    <i className="ti ti-check" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="rules-restaurants-grid">
                {SPIFFOS_RESTAURANTS.map(r => (
                  <div key={r.id} className="rules-restaurant-chip">
                    <i className="ti ti-map-pin" /> {r.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Aba Pontuação ── */}
          {tab === 'score' && (
            <div className="rules-score-section">
              <table className="rules-score-table">
                <tbody>
                  <tr>
                    <td><i className="ti ti-skull" /> Cada zumbi abatido</td>
                    <td className="pts-col">+{SCORE_KILLS_PER_KILL} pt</td>
                  </tr>
                  <tr className="score-table-note">
                    <td colSpan={2}>Máximo contabilizado: {SCORE_KILLS_MAX.toLocaleString('pt-BR')} zumbis ({Math.round(SCORE_KILLS_MAX * SCORE_KILLS_PER_KILL).toLocaleString('pt-BR')} pts)</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-star" /> Cada habilidade no nível 10</td>
                    <td className="pts-col">+{SCORE_SKILL_10.toLocaleString('pt-BR')} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-building-store" /> Base estabelecida em um Spiffo's</td>
                    <td className="pts-col">+{SCORE_SPIFFO_DONE.toLocaleString('pt-BR')} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-building-store" /> Sede do Spiffo's conquistada (Louisville HQ)</td>
                    <td className="pts-col">+{SCORE_SPIFFO_HQ.toLocaleString('pt-BR')} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-trophy" /> Relíquia do Spiffo coletada</td>
                    <td className="pts-col">+{SCORE_SPIFFO_RELIC.toLocaleString('pt-BR')} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-sword" /> Base Militar de Rosewood conquistada</td>
                    <td className="pts-col">+{SCORE_MILITARY.toLocaleString('pt-BR')} pts</td>
                  </tr>
                </tbody>
              </table>

              <div className="rules-max-score">
                <span className="rules-max-label">Pontuação máxima possível</span>
                <span className="rules-max-value">{MAX_POSSIBLE_SCORE.toLocaleString('pt-BR')} pts</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
