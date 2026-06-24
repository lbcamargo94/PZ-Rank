import { useState } from 'react';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS, SCORE_KILLS_MAX, SCORE_BASE, SCORE_BASE_ITEM,
  SCORE_KILLS_500K, SCORE_ALL_SKILLS, SCORE_STATUE, SCORE_MILITARY,
} from '../lib/objectives';
import {
  IconShieldStar,
  IconTarget,
  IconBuildingStore,
  IconCalculator,
  IconSkull,
  IconStar,
  IconTrophy,
  IconSword,
  IconArrowRight,
  IconCheck,
  IconMapPin,
} from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconShieldStar size={20} /> Regras do Desafio
          </DialogTitle>
        </DialogHeader>

        <p className="rules-modal-sub">
          Sobreviva o máximo possível e complete objetivos para acumular pontos.
        </p>

        <div className="rules-tabs">
          <button className={`rules-tab${tab === 'objectives' ? ' active' : ''}`} onClick={() => setTab('objectives')}>
            <IconTarget size={16} /> Objetivos
          </button>
          <button className={`rules-tab${tab === 'bases' ? ' active' : ''}`} onClick={() => setTab('bases')}>
            <IconBuildingStore size={16} /> Bases Spiffo's
          </button>
          <button className={`rules-tab${tab === 'score' ? ' active' : ''}`} onClick={() => setTab('score')}>
            <IconCalculator size={16} /> Pontuação
          </button>
        </div>

        <div className="rules-tab-body">

          {tab === 'objectives' && (
            <div className="rules-section-list">
              <div className="rules-obj-card">
                <div className="rules-obj-icon"><IconSkull size={20} /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">500.000 Zumbis Abatidos</span>
                  <span className="rules-obj-desc">Abata 500 mil zumbis ao longo da sua sobrevivência.</span>
                  <span className="rules-pts-badge">+{SCORE_KILLS_500K.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>
              <div className="rules-obj-card">
                <div className="rules-obj-icon"><IconStar size={20} /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Todas as Habilidades no Nível 10</span>
                  <span className="rules-obj-desc">Maximize todas as habilidades do personagem ao nível 10.</span>
                  <span className="rules-pts-badge">+{SCORE_ALL_SKILLS.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>
              <div className="rules-obj-card">
                <div className="rules-obj-icon"><IconTrophy size={20} /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Estátua do Spiffo</span>
                  <span className="rules-obj-desc">Domine a Sede do Spiffo's em Louisville e colete a Estátua do Spiffo.</span>
                  <span className="rules-pts-badge">+{SCORE_STATUE.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>
              <div className="rules-obj-card">
                <div className="rules-obj-icon"><IconSword size={20} /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Base Militar de Rosewood</span>
                  <span className="rules-obj-desc">Limpe completamente a base militar secreta de Rosewood.</span>
                  <span className="rules-pts-badge">+{SCORE_MILITARY.toLocaleString('pt-BR')} pts</span>
                </div>
              </div>
              <div className="rules-obj-card rules-obj-card-wide">
                <div className="rules-obj-icon"><IconBuildingStore size={20} /></div>
                <div className="rules-obj-content">
                  <span className="rules-obj-title">Bases nos Restaurantes Spiffo's</span>
                  <span className="rules-obj-desc">
                    Estabeleça uma base em cada um dos {SPIFFOS_RESTAURANTS.length} restaurantes Spiffo's no mapa.
                    Cada base vale <strong>+{SCORE_BASE} pts</strong> e pode ter até {BASE_ITEMS.length} itens completados
                    (<strong>+{SCORE_BASE_ITEM} pts cada</strong>).
                  </span>
                  <button className="rules-tab-link" onClick={() => setTab('bases')}>
                    Ver todos os restaurantes <IconArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'bases' && (
            <div className="rules-bases-section">
              <p className="rules-bases-intro">
                Estabeleça uma base em cada restaurante com os itens abaixo para maximizar sua pontuação:
              </p>
              <div className="rules-base-items-list">
                {BASE_ITEMS.map(item => (
                  <div key={item.id} className="rules-base-item-row">
                    <IconCheck size={16} />
                    <span>{item.label}</span>
                    <span className="rules-pts-badge-sm">+{SCORE_BASE_ITEM} pts</span>
                  </div>
                ))}
              </div>
              <div className="rules-restaurants-grid">
                {SPIFFOS_RESTAURANTS.map(r => (
                  <div key={r.id} className="rules-restaurant-chip">
                    <IconMapPin size={16} /> {r.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'score' && (
            <div className="rules-score-section">
              <table className="rules-score-table">
                <tbody>
                  <tr>
                    <td><IconSkull size={16} /> Cada zumbi abatido</td>
                    <td className="pts-col">+{SCORE_KILLS} pt</td>
                  </tr>
                  <tr className="score-table-note">
                    <td colSpan={2}>Máximo contabilizado: {SCORE_KILLS_MAX.toLocaleString('pt-BR')} zumbis</td>
                  </tr>
                  <tr>
                    <td><IconBuildingStore size={16} /> Base em um Spiffo's</td>
                    <td className="pts-col">+{SCORE_BASE} pts</td>
                  </tr>
                  <tr>
                    <td><IconCheck size={16} /> Item completo da base (×{BASE_ITEMS.length} por restaurante)</td>
                    <td className="pts-col">+{SCORE_BASE_ITEM} pts</td>
                  </tr>
                  <tr>
                    <td><IconTrophy size={16} /> Estátua do Spiffo</td>
                    <td className="pts-col">+{SCORE_STATUE} pts</td>
                  </tr>
                  <tr>
                    <td><IconSword size={16} /> Base militar de Rosewood limpa</td>
                    <td className="pts-col">+{SCORE_MILITARY} pts</td>
                  </tr>
                  <tr>
                    <td><IconSkull size={16} /> 500.000 zumbis abatidos</td>
                    <td className="pts-col">+{SCORE_KILLS_500K} pts</td>
                  </tr>
                  <tr>
                    <td><IconStar size={16} /> Todas as habilidades nível 10</td>
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
      </DialogContent>
    </Dialog>
  );
}