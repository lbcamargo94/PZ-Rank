import { useState, useEffect } from 'react';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS, SCORE_KILLS_MAX, SCORE_BASE, SCORE_BASE_ITEM,
  SCORE_KILLS_500K, SCORE_ALL_SKILLS, SCORE_STATUE, SCORE_MILITARY,
} from '../lib/objectives';

interface Props {
  onClose: () => void;
}

type Tab = 'objectives' | 'bases' | 'score';

const MAX_SCORE =
  SCORE_KILLS_MAX * SCORE_KILLS +
  SPIFFOS_RESTAURANTS.length * (SCORE_BASE + BASE_ITEMS.length * SCORE_BASE_ITEM) +
  SCORE_STATUE + SCORE_MILITARY + SCORE_KILLS_500K + SCORE_ALL_SKILLS;

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
                  <span className="rules-obj-title">500.000 Zumbis Abatidos</span>
                  <span className="rules-obj-desc">Abata 500 mil zumbis ao longo da sua sobrevivência.</span>
                  <span className="rules-pts-badge">+{SCORE_KILLS_500K.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-star" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Todas as Habilidades no Nível 10</span>
                  <span className="rules-obj-desc">Maximize todas as habilidades do personagem ao nível 10.</span>
                  <span className="rules-pts-badge">+{SCORE_ALL_SKILLS.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-trophy" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Estátua do Spiffo</span>
                  <span className="rules-obj-desc">
                    Domine a Sede do Spiffo's em Louisville e colete a Estátua do Spiffo.
                  </span>
                  <span className="rules-pts-badge">+{SCORE_STATUE.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card">
                <div className="rules-obj-icon"><i className="ti ti-sword" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Base Militar de Rosewood</span>
                  <span className="rules-obj-desc">
                    Limpe completamente a base militar secreta de Rosewood.
                  </span>
                  <span className="rules-pts-badge">+{SCORE_MILITARY.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>

              <div className="rules-obj-card rules-obj-card-wide">
                <div className="rules-obj-icon"><i className="ti ti-building-store" /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Bases nos Restaurantes Spiffo's</span>
                  <span className="rules-obj-desc">
                    Estabeleça uma base em cada um dos {SPIFFOS_RESTAURANTS.length} restaurantes Spiffo's no mapa.
                    Cada base vale <strong>+{SCORE_BASE} pts</strong> e pode ter até {BASE_ITEMS.length} itens completados
                    (<strong>+{SCORE_BASE_ITEM} pts cada</strong>).
                  </span>
                  <button className="rules-tab-link" onClick={() => setTab('bases')}>
                    Ver todos os restaurantes <i className="ti ti-arrow-right" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ── Aba Bases Spiffo's ── */}
          {tab === 'bases' && (
            <div className="rules-bases-section">
              <p className="rules-bases-intro">
                Estabeleça uma base em cada restaurante com os itens abaixo para maximizar sua pontuação:
              </p>

              <div className="rules-base-items-list">
                {BASE_ITEMS.map(item => (
                  <div key={item.id} className="rules-base-item-row">
                    <i className="ti ti-check" />
                    <span>{item.label}</span>
                    <span className="rules-pts-badge-sm">+{SCORE_BASE_ITEM} pts</span>
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
                    <td className="pts-col">+{SCORE_KILLS} pt</td>
                  </tr>
                  <tr className="score-table-note">
                    <td colSpan={2}>Máximo contabilizado: {SCORE_KILLS_MAX.toLocaleString('pt-BR')} zumbis</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-building-store" /> Base em um Spiffo's</td>
                    <td className="pts-col">+{SCORE_BASE} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-check" /> Item completo da base (×{BASE_ITEMS.length} por restaurante)</td>
                    <td className="pts-col">+{SCORE_BASE_ITEM} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-trophy" /> Estátua do Spiffo</td>
                    <td className="pts-col">+{SCORE_STATUE} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-sword" /> Base militar de Rosewood limpa</td>
                    <td className="pts-col">+{SCORE_MILITARY} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-skull" /> 500.000 zumbis abatidos</td>
                    <td className="pts-col">+{SCORE_KILLS_500K} pts</td>
                  </tr>
                  <tr>
                    <td><i className="ti ti-star" /> Todas as habilidades nível 10</td>
                    <td className="pts-col">+{SCORE_ALL_SKILLS} pts</td>
                  </tr>
                </tbody>
              </table>

              <div className="rules-max-score">
                <span className="rules-max-label">Pontuação máxima possível</span>
                <span className="rules-max-value">{MAX_SCORE.toLocaleString('pt-BR')} pts</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
