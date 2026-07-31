import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS, SCORE_KILLS_MAX, SCORE_BASE, SCORE_BASE_ITEM,
  SCORE_KILLS_500K, SCORE_ALL_SKILLS, SCORE_STATUE, SCORE_MILITARY,
} from '../lib/objectives';
import regrasBg from '../../assets/background/tela-de-regras.webp';
import './regras.css';

type Section = 'participar' | 'objetivos' | 'sandbox' | 'conduta';

const SECTIONS: { id: Section; icon: string; label: string }[] = [
  { id: 'participar', icon: 'ti-user-plus',     label: 'Como Participar'        },
  { id: 'objetivos',  icon: 'ti-target',         label: 'Objetivos & Pontuação'  },
  { id: 'sandbox',    icon: 'ti-settings',        label: 'Config. do Sandbox'     },
  { id: 'conduta',    icon: 'ti-shield-check',    label: 'Regras de Conduta'      },
];

const MAX_SCORE =
  SCORE_KILLS_MAX * SCORE_KILLS +
  SPIFFOS_RESTAURANTS.length * (SCORE_BASE + BASE_ITEMS.length * SCORE_BASE_ITEM) +
  SCORE_STATUE + SCORE_MILITARY + SCORE_KILLS_500K + SCORE_ALL_SKILLS;

const SANDBOX_GROUPS = [
  {
    title: 'Zumbis — População',
    icon: 'ti-users',
    rows: [
      { label: 'Multiplicador de população',          value: '4.0×' },
      { label: 'Pop. inicial',                        value: '2.5×' },
      { label: 'Pop. no pico',                        value: '2.5×' },
      { label: 'Dia do pico',                         value: 'Dia 1' },
      { label: 'Respawn',                             value: 'Nenhum' },
      { label: 'Migração de zumbis',                  value: 'A cada 24h' },
      { label: 'Raio de audição',                     value: '600 unidades' },
      { label: 'Tamanho da horda',                    value: '0' },
      { label: 'Variação do grupo da horda',          value: '50' },
      { label: 'Distância de formação de hordas',     value: '20' },
      { label: 'Separação de hordas',                 value: '15' },
      { label: 'Raio de hordas',                      value: '3' },
    ],
  },
  {
    title: 'Zumbis — Comportamento',
    icon: 'ti-brain',
    rows: [
      { label: 'Velocidade',                          value: 'Normal (0% corredores)' },
      { label: 'Força',                               value: 'Super-humano' },
      { label: 'Resistência',                         value: 'Normal' },
      { label: 'Transmissão de infecção',             value: 'Apenas Saliva' },
      { label: 'Mortalidade da infecção',             value: '2–3 Dias' },
      { label: 'Tempo de reanimação',                 value: 'Instantâneo' },
      { label: 'Percepção / Abertura de portas',      value: 'Avançado' },
      { label: 'Abertura aleatória de portas',        value: '0 (Nenhuma)' },
      { label: 'Rastejantes em veículos',             value: 'Frequentemente' },
      { label: 'Memória',                             value: 'Longa' },
      { label: 'Visão',                               value: 'Olhos de Águia' },
      { label: 'Audição',                             value: 'Alta' },
      { label: 'Fake Dead',                           value: 'Total (incl. mortos pelo jogador)' },
      { label: 'Derrubar sobrevivente',               value: 'Sim' },
      { label: 'Rastejadores derrubam',               value: 'Sim' },
      { label: 'Dano em cercas — multiplicador',      value: '2.0×' },
      { label: 'Chance de arma equipada no zumbi',    value: '6%' },
      { label: 'Armadura do zumbi',                   value: '2.0 (máx. 90%)' },
    ],
  },
  {
    title: 'Loot',
    icon: 'ti-package-off',
    rows: [
      { label: 'Todas as categorias de loot',         value: '0.04 (Muito Baixo)' },
      { label: 'Efeito da população no loot',         value: '2 (Baixo)' },
      { label: 'Geradores',                           value: 'Extremamente Raro' },
      { label: 'Respawn de itens',                    value: 'Nenhum' },
    ],
  },
  {
    title: 'Mundo',
    icon: 'ti-world',
    rows: [
      { label: 'Desligamento da água',                value: 'Instantâneo' },
      { label: 'Desligamento da eletricidade',        value: 'Instantâneo' },
      { label: 'Decaimento da bateria do alarme',     value: '0–5 Anos' },
      { label: 'Casas com alarmes',                   value: 'Muito Frequentemente' },
      { label: 'Casas trancadas',                     value: 'Muito Frequentemente' },
      { label: 'Propagação de fogo',                  value: 'Sim' },
    ],
  },
  {
    title: 'Natureza',
    icon: 'ti-leaf',
    rows: [
      { label: 'Temperatura',                         value: 'Muito Frio' },
      { label: 'Chuva',                               value: 'Seco' },
      { label: 'Escuridão noturna',                   value: 'Normal' },
      { label: 'Abundância da pesca',                 value: 'Muito Ruim' },
      { label: 'Abundância natural',                  value: 'Muito Ruim' },
    ],
  },
  {
    title: 'Eventos',
    icon: 'ti-bell',
    rows: [
      { label: 'Evento do helicóptero',               value: 'Uma Vez' },
      { label: 'Eventos aleatórios',                  value: 'Nunca' },
      { label: 'Alarmes de casas',                    value: 'Muito Frequentemente' },
    ],
  },
  {
    title: 'Personagem',
    icon: 'ti-user',
    rows: [
      { label: 'Kit inicial',                         value: 'Não' },
      { label: 'Pontos extras de traços',             value: '0' },
      { label: 'Fraturas ósseas',                     value: 'Sim' },
      { label: 'Multiplicador global de XP',          value: '0.8×' },
      { label: 'Multi-hit com armas',                 value: 'Não' },
      { label: 'Escalada fácil',                      value: 'Não' },
      { label: 'Bloqueio no ataque',                  value: 'Sim' },
      { label: 'Penalidade de traços negativos',      value: 'Nenhuma' },
      { label: 'Nutrição',                            value: 'Sim' },
    ],
  },
  {
    title: 'Armas de Fogo',
    icon: 'ti-crosshair',
    rows: [
      { label: 'Multiplicador de ruído',              value: '2.0×' },
      { label: 'Multiplicador de atolamento',         value: '1.0×' },
      { label: 'Dano por armas de fogo',              value: 'Apenas Zumbis' },
    ],
  },
  {
    title: 'Veículos',
    icon: 'ti-car',
    rows: [
      { label: 'Veículos trancados',                  value: 'Muito Frequentemente' },
      { label: 'Condição geral',                      value: 'Muito Baixo' },
      { label: 'Gasolina inicial',                    value: 'Muito Baixo' },
      { label: 'Chance de ter gasolina',              value: 'Baixo' },
      { label: 'Alarme de carro',                     value: 'Muito Frequentemente' },
      { label: 'Fácil uso',                           value: 'Não' },
    ],
  },
  {
    title: 'Animais',
    icon: 'ti-paw',
    rows: [
      { label: 'Chance de aparecer animais de rancho', value: 'Raro' },
      { label: 'Animais atraem zumbis',               value: 'Sim' },
      { label: 'Época da reprodução',                 value: 'Sim' },
    ],
  },
  {
    title: 'Mapa',
    icon: 'ti-map-2',
    rows: [
      { label: 'Mini-mapa',                           value: 'Permitido' },
      { label: 'Mapa do mundo',                       value: 'Permitido' },
      { label: 'Todo o mapa revelado',                value: 'Sim' },
      { label: 'Luz necessária para ler o mapa',      value: 'Sim' },
    ],
  },
];

const PARTICIPATE_STEPS = [
  {
    n: '01',
    icon: 'ti-user-circle',
    title: 'Cadastre-se no site',
    desc: 'Crie sua conta em pzrank.com.br. Seu cadastro precisa ser aprovado por um moderador antes de aparecer no ranking.',
    action: { label: 'Criar conta', to: '/login' },
  },
  {
    n: '02',
    icon: 'ti-puzzle',
    title: 'Instale o Mod Oficial',
    desc: 'Assine o mod "PZCommunityRank" na Steam Workshop e ative-o no Project Zomboid. O mod valida sua sandbox e registra suas estatísticas.',
    action: null,
  },
  {
    n: '03',
    icon: 'ti-download',
    title: 'Instale o PZ Rank Companion',
    desc: 'O Companion monitora sua pasta de saves e sincroniza automaticamente com o ranking. Necessário para que suas corridas apareçam no site.',
    action: { label: 'Baixar Companion v1.8.1', to: 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/latest', external: true },
  },
  {
    n: '04',
    icon: 'ti-settings',
    title: 'Use o Preset Oficial',
    desc: 'Inicie um novo jogo com o preset "Brasileirão PZ" ativado pelo mod. O sandbox precisa estar 100% idêntico às configurações oficiais — qualquer divergência gera desclassificação automática.',
    action: { label: 'Ver configurações', to: '#sandbox', scroll: true },
  },
  {
    n: '05',
    icon: 'ti-refresh',
    title: 'Sincronize Automaticamente',
    desc: 'O Companion detecta quando você salva o jogo e sincroniza os dados em segundo plano. Cada sync atualiza dias sobrevividos, kills, habilidades e objetivos.',
    action: null,
  },
  {
    n: '06',
    icon: 'ti-trophy',
    title: 'Acompanhe no Ranking',
    desc: 'Sua posição é calculada automaticamente por pontuação. Acesse sua página de jogador para ver o histórico completo de runs e conquistas.',
    action: { label: 'Ver ranking', to: '/rank' },
  },
];

const CONDUCT_ALLOWED = [
  'Mods da lista oficial do campeonato (visíveis em /mods)',
  'QoL mods que não alteram mecânicas de jogo ou loot',
  'Texturas e mods de interface (sem impacto em gameplay)',
  'Mods de mapa que adicionam locais mas não alteram spawn ou loot',
];

const CONDUCT_FORBIDDEN = [
  'Mods não autorizados que alterem loot, spawn de zumbis ou mecânicas',
  'Cheats, trainers ou qualquer forma de manipulação de memória',
  'Edição manual de arquivos de save (.save, .json, .db)',
  'Usar o mesmo personagem em múltiplas contas simultâneas',
  'Compartilhar personagem com outro jogador (run deve ser individual)',
  'Alterar as configurações do sandbox após iniciar a run',
];

const CONDUCT_DISQ = [
  { trigger: 'Sandbox incorreto', detail: 'O mod detecta e marca automaticamente. Qualquer divergência do preset oficial gera desclassificação imediata.' },
  { trigger: 'Mod não autorizado detectado', detail: 'Identificado pelo moderador via análise do código da run ou denúncia verificada.' },
  { trigger: 'Save manipulado', detail: 'Inconsistência entre timestamps do save, dados do código e histórico de syncs.' },
  { trigger: 'Comportamento antidesportivo', detail: 'Denúncias verificadas por moderadores. Decisão final cabe ao time de moderação.' },
];

export function RegrasPage() {
  const [active, setActive] = useState<Section>('participar');

  return (
    <div className="rg-page" style={{ '--rg-bg-img': `url(${regrasBg})` } as React.CSSProperties}>
      <header className="rg-header">
        <div className="rg-header-inner">
          <Link to="/" className="rg-back-link">
            <i className="ti ti-arrow-left" />
            <span>Início</span>
          </Link>
          <div className="rg-header-title-block">
            <p className="rg-eyebrow">BRASILEIRÃO PZ · TEMPORADA 1</p>
            <h1 className="rg-title">REGRAS DO DESAFIO</h1>
            <p className="rg-subtitle">Tudo que você precisa saber para participar e competir.</p>
          </div>
        </div>
      </header>

      <div className="rg-layout">

        {/* ── Sidebar ── */}
        <nav className="rg-sidebar" aria-label="Seções das regras">
          <ul className="rg-nav-list">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <button
                  className={`rg-nav-item${active === s.id ? ' is-active' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  <i className={`ti ${s.icon} rg-nav-icon`} />
                  <span className="rg-nav-label">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Main ── */}
        <main className="rg-main">

          {/* ── Como Participar ── */}
          {active === 'participar' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-user-plus rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">Como Participar</h2>
                  <p className="rg-section-sub">Seis passos para começar a competir no Brasileirão PZ.</p>
                </div>
              </div>

              <div className="rg-steps">
                {PARTICIPATE_STEPS.map(step => (
                  <div key={step.n} className="rg-step-card">
                    <div className="rg-step-n">{step.n}</div>
                    <div className="rg-step-body">
                      <div className="rg-step-head">
                        <i className={`ti ${step.icon} rg-step-icon`} />
                        <h3 className="rg-step-title">{step.title}</h3>
                      </div>
                      <p className="rg-step-desc">{step.desc}</p>
                      {step.action && (
                        step.action.external ? (
                          <a href={step.action.to} className="rg-step-action" target="_blank" rel="noopener noreferrer">
                            {step.action.label} <i className="ti ti-external-link" />
                          </a>
                        ) : (
                          <Link to={step.action.to} className="rg-step-action">
                            {step.action.label} <i className="ti ti-arrow-right" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rg-callout rg-callout--info">
                <i className="ti ti-info-circle" />
                <span>O mod exige versão mínima <strong>v2.9.0</strong>. Mantenha sempre o mod e o Companion atualizados para evitar bloqueio de sync.</span>
              </div>
            </div>
          )}

          {/* ── Objetivos & Pontuação ── */}
          {active === 'objetivos' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-target rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">Objetivos & Pontuação</h2>
                  <p className="rg-section-sub">Complete objetivos para acumular pontos além dos dias e kills.</p>
                </div>
              </div>

              {/* Base Score */}
              <h3 className="rg-sub-title">Pontuação Base</h3>
              <div className="rg-score-table-wrap">
                <table className="rg-score-table">
                  <tbody>
                    <tr>
                      <td><i className="ti ti-skull" /> Cada zumbi abatido</td>
                      <td className="rg-pts-col">+{SCORE_KILLS} pt</td>
                    </tr>
                    <tr className="rg-score-note">
                      <td colSpan={2}>Máximo contabilizado: {SCORE_KILLS_MAX.toLocaleString('pt-BR')} zumbis</td>
                    </tr>
                    <tr>
                      <td><i className="ti ti-building-store" /> Base estabelecida em um Spiffo's</td>
                      <td className="rg-pts-col">+{SCORE_BASE} pts</td>
                    </tr>
                    <tr>
                      <td><i className="ti ti-check" /> Item completo por base Spiffo's (×{BASE_ITEMS.length})</td>
                      <td className="rg-pts-col">+{SCORE_BASE_ITEM} pts</td>
                    </tr>
                    <tr>
                      <td><i className="ti ti-trophy" /> Estátua do Spiffo coletada</td>
                      <td className="rg-pts-col">+{SCORE_STATUE} pts</td>
                    </tr>
                    <tr>
                      <td><i className="ti ti-sword" /> Base militar de Rosewood limpa</td>
                      <td className="rg-pts-col">+{SCORE_MILITARY} pts</td>
                    </tr>
                    <tr>
                      <td><i className="ti ti-skull" /> 500.000 zumbis abatidos</td>
                      <td className="rg-pts-col">+{SCORE_KILLS_500K} pts</td>
                    </tr>
                    <tr>
                      <td><i className="ti ti-star" /> Todas as habilidades no nível 10</td>
                      <td className="rg-pts-col">+{SCORE_ALL_SKILLS} pts</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rg-max-score">
                <span className="rg-max-label">Pontuação máxima possível</span>
                <span className="rg-max-value">{MAX_SCORE.toLocaleString('pt-BR')} pts</span>
              </div>

              {/* Objectives detail */}
              <h3 className="rg-sub-title">Objetivos Especiais</h3>
              <div className="rg-obj-list">
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-skull" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">500.000 Zumbis Abatidos</span>
                    <span className="rg-obj-desc">Abata 500 mil zumbis ao longo de toda a sua sobrevivência.</span>
                    <span className="rg-pts-badge">+{SCORE_KILLS_500K.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-star" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Todas as Habilidades no Nível 10</span>
                    <span className="rg-obj-desc">Maximize todas as habilidades do personagem ao nível 10.</span>
                    <span className="rg-pts-badge">+{SCORE_ALL_SKILLS.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-trophy" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Estátua do Spiffo</span>
                    <span className="rg-obj-desc">Domine a Sede do Spiffo's em Louisville e colete a Estátua do Spiffo.</span>
                    <span className="rg-pts-badge">+{SCORE_STATUE.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-sword" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Base Militar de Rosewood</span>
                    <span className="rg-obj-desc">Limpe completamente a base militar secreta de Rosewood.</span>
                    <span className="rg-pts-badge">+{SCORE_MILITARY.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
              </div>

              {/* Spiffo's Bases */}
              <h3 className="rg-sub-title">Bases nos Restaurantes Spiffo's</h3>
              <p className="rg-spiffos-intro">
                Estabeleça uma base em cada um dos <strong>{SPIFFOS_RESTAURANTS.length} restaurantes</strong> Spiffo's no mapa.
                Cada base vale <strong>+{SCORE_BASE} pts</strong> e pode ter até {BASE_ITEMS.length} itens completados
                (<strong>+{SCORE_BASE_ITEM} pts</strong> cada).
              </p>
              <div className="rg-base-items">
                {BASE_ITEMS.map(item => (
                  <div key={item.id} className="rg-base-item-row">
                    <i className="ti ti-check" />
                    <span>{item.label}</span>
                    <span className="rg-pts-badge-sm">+{SCORE_BASE_ITEM} pts</span>
                  </div>
                ))}
              </div>
              <div className="rg-restaurants-grid">
                {SPIFFOS_RESTAURANTS.map(r => (
                  <div key={r.id} className="rg-restaurant-chip">
                    <i className="ti ti-map-pin" /> {r.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Configurações do Sandbox ── */}
          {active === 'sandbox' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-settings rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">Configurações do Sandbox</h2>
                  <p className="rg-section-sub">Preset oficial "Brasileirão PZ" — Temporada 1. O mod verifica e corrige automaticamente.</p>
                </div>
              </div>

              <div className="rg-callout rg-callout--warn">
                <i className="ti ti-alert-triangle" />
                <span>Qualquer divergência dessas configurações resulta em <strong>desclassificação automática</strong>. O preset é aplicado automaticamente ao iniciar um novo jogo com o mod ativo.</span>
              </div>

              <div className="rg-sandbox-groups">
                {SANDBOX_GROUPS.map(group => (
                  <section key={group.title} className="rg-sandbox-group">
                    <h3 className="rg-sandbox-group-title">
                      <i className={`ti ${group.icon}`} /> {group.title}
                    </h3>
                    <div className="rg-sandbox-rows">
                      {group.rows.map(row => (
                        <div key={row.label} className="rg-sandbox-row">
                          <span className="rg-sandbox-label">{row.label}</span>
                          <span className="rg-sandbox-value">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* ── Regras de Conduta ── */}
          {active === 'conduta' && (
            <div className="rg-section">
              <div className="rg-section-header">
                <i className="ti ti-shield-check rg-section-icon" />
                <div>
                  <h2 className="rg-section-title">Regras de Conduta</h2>
                  <p className="rg-section-sub">O campeonato preza pelo jogo limpo. Violações resultam em desclassificação ou banimento.</p>
                </div>
              </div>

              {/* Permitido */}
              <h3 className="rg-sub-title rg-sub-title--ok">
                <i className="ti ti-circle-check" /> O que é permitido
              </h3>
              <ul className="rg-conduct-list rg-conduct-list--ok">
                {CONDUCT_ALLOWED.map((item, i) => (
                  <li key={i} className="rg-conduct-item">
                    <i className="ti ti-check rg-conduct-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="rg-conduct-action">
                <Link to="/mods" className="rg-step-action">
                  Ver lista de mods permitidos <i className="ti ti-arrow-right" />
                </Link>
              </div>

              {/* Proibido */}
              <h3 className="rg-sub-title rg-sub-title--err" style={{ marginTop: '2rem' }}>
                <i className="ti ti-circle-x" /> O que é proibido
              </h3>
              <ul className="rg-conduct-list rg-conduct-list--err">
                {CONDUCT_FORBIDDEN.map((item, i) => (
                  <li key={i} className="rg-conduct-item">
                    <i className="ti ti-x rg-conduct-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Desclassificação */}
              <h3 className="rg-sub-title" style={{ marginTop: '2rem' }}>
                <i className="ti ti-ban" /> Desclassificação
              </h3>
              <div className="rg-disq-list">
                {CONDUCT_DISQ.map((d, i) => (
                  <div key={i} className="rg-disq-card">
                    <span className="rg-disq-trigger">{d.trigger}</span>
                    <span className="rg-disq-detail">{d.detail}</span>
                  </div>
                ))}
              </div>

              {/* Banimento */}
              <div className="rg-callout rg-callout--err" style={{ marginTop: '2rem' }}>
                <i className="ti ti-ban" />
                <div>
                  <strong>Banimento permanente</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>Casos de uso comprovado de cheats, manipulação de saves ou criação de múltiplas contas para burlar regras resultam em banimento permanente de todas as temporadas, incluindo remoção do Hall da Fama.</p>
                </div>
              </div>

              <div className="rg-callout rg-callout--info" style={{ marginTop: '1rem' }}>
                <i className="ti ti-info-circle" />
                <span>Dúvidas ou denúncias? Entre em contato com a moderação via Discord ou pelas redes sociais do campeonato.</span>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
