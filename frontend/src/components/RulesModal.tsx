import { useEffect } from 'react';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS, SCORE_KILLS_MAX, SCORE_BASE, SCORE_BASE_ITEM,
  SCORE_KILLS_500K, SCORE_ALL_SKILLS, SCORE_STATUE, SCORE_MILITARY,
} from '../lib/objectives';

interface Props {
  onClose: () => void;
}

export function RulesModal({ onClose }: Props) {
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

        <h2 className="modal-title"><i className="ti ti-shield-star" /> Regras do Desafio</h2>

        {/* Banner do desafio — coloque a imagem em frontend/public/challenge-banner.jpg */}
        <div className="rules-banner">
          <img
            src="/challenge-banner.jpg"
            alt="Imagem do desafio"
            className="rules-banner-img"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div className="rules-body">

          <section className="rules-section">
            <h3 className="rules-section-title"><i className="ti ti-target" /> Objetivos do Desafio</h3>
            <p className="rules-intro">
              Sobreviva o máximo possível e complete os objetivos abaixo para acumular pontos no ranking geral.
            </p>
          </section>

          {/* Bases Spiffo's */}
          <section className="rules-section">
            <h3 className="rules-section-title">
              <i className="ti ti-building-store" /> Bases nos Restaurantes Spiffo's
              <span className="rules-pts">+{SCORE_BASE} pts cada</span>
            </h3>
            <p className="rules-desc">Estabeleça uma base em cada um dos restaurantes Spiffo's no mapa:</p>
            <ul className="rules-list">
              {SPIFFOS_RESTAURANTS.map(r => (
                <li key={r.id} className="rules-restaurant-item">
                  <i className="ti ti-map-pin" /> {r.name}
                </li>
              ))}
            </ul>

            <div className="rules-sub-objectives">
              <p className="rules-sub-title">Cada base deve conter os seguintes itens <span className="rules-pts">+{SCORE_BASE_ITEM} pts cada</span>:</p>
              <ul className="rules-list">
                {BASE_ITEMS.map(item => (
                  <li key={item.id}><i className="ti ti-check" /> {item.label}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Objetivos especiais */}
          <section className="rules-section">
            <h3 className="rules-section-title"><i className="ti ti-star" /> Objetivos Especiais</h3>
            <ul className="rules-list rules-special">
              <li>
                <div className="rules-special-item">
                  <span><i className="ti ti-trophy" /> Dominou a Sede Spiffo's em Louisville e pegou a Estátua do Spiffo</span>
                  <span className="rules-pts">+{SCORE_STATUE} pts</span>
                </div>
              </li>
              <li>
                <div className="rules-special-item">
                  <span><i className="ti ti-sword" /> Limpou a base militar secreta de Rosewood</span>
                  <span className="rules-pts">+{SCORE_MILITARY} pts</span>
                </div>
              </li>
              <li>
                <div className="rules-special-item">
                  <span><i className="ti ti-skull" /> Atingiu 500.000 zumbis abatidos</span>
                  <span className="rules-pts">+{SCORE_KILLS_500K} pts</span>
                </div>
              </li>
              <li>
                <div className="rules-special-item">
                  <span><i className="ti ti-star" /> Maximizou todas as habilidades (nível 10)</span>
                  <span className="rules-pts">+{SCORE_ALL_SKILLS} pts</span>
                </div>
              </li>
            </ul>
          </section>

          {/* Tabela de pontuação */}
          <section className="rules-section">
            <h3 className="rules-section-title"><i className="ti ti-calculator" /> Pontuação</h3>
            <table className="rules-score-table">
              <tbody>
                <tr><td>Cada zumbi abatido (máx. {SCORE_KILLS_MAX.toLocaleString('pt-BR')})</td><td className="pts-col">+{SCORE_KILLS} pt</td></tr>
                <tr><td>Base em um Spiffo's</td><td className="pts-col">+{SCORE_BASE} pts</td></tr>
                <tr><td>Item completo da base (×{BASE_ITEMS.length} por restaurante)</td><td className="pts-col">+{SCORE_BASE_ITEM} pts</td></tr>
                <tr><td>Estátua do Spiffo</td><td className="pts-col">+{SCORE_STATUE} pts</td></tr>
                <tr><td>Base militar de Rosewood limpa</td><td className="pts-col">+{SCORE_MILITARY} pts</td></tr>
                <tr><td>500.000 zumbis abatidos</td><td className="pts-col">+{SCORE_KILLS_500K} pts</td></tr>
                <tr><td>Todas as habilidades nível 10</td><td className="pts-col">+{SCORE_ALL_SKILLS} pts</td></tr>
              </tbody>
            </table>
            <p className="rules-max-note">
              Pontuação máxima possível:{' '}
              <strong>{SCORE_KILLS_MAX * SCORE_KILLS + SPIFFOS_RESTAURANTS.length * (SCORE_BASE + BASE_ITEMS.length * SCORE_BASE_ITEM) + SCORE_STATUE + SCORE_MILITARY + SCORE_KILLS_500K + SCORE_ALL_SKILLS} pts</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
