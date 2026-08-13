import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  SCORE_KILLS_PER_KILL, SCORE_KILLS_MAX,
  SCORE_SKILL_10, SCORE_SPIFFO_DONE, SCORE_MILITARY,
  SCORE_SPIFFO_HQ, SCORE_SPIFFO_RELIC, MAX_POSSIBLE_SCORE,
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
    action: { label: 'Baixar Companion v1.9.9', to: 'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/latest', external: true },
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

const FUNDAMENTAL_RULES = [
  {
    n: '01',
    icon: 'ti-video',
    title: 'Transmissão Obrigatória',
    desc: 'Toda a participação no campeonato deve ser transmitida ao vivo em uma live gameplay.',
  },
  {
    n: '02',
    icon: 'ti-brand-youtube',
    title: 'YouTube como Plataforma Oficial',
    desc: 'A transmissão deve ser realizada no YouTube e permanecer salva no canal do participante para futuras auditorias. Outras plataformas podem ser utilizadas simultaneamente, desde que a live no YouTube seja mantida.',
  },
  {
    n: '03',
    icon: 'ti-settings',
    title: 'Configuração Oficial',
    desc: 'É obrigatório utilizar a versão do jogo, o preset de Sandbox e a Mod List Oficial definidos pelo campeonato. Qualquer alteração resultará na invalidação da tentativa.',
  },
  {
    n: '04',
    icon: 'ti-puzzle',
    title: 'Mods Permitidos',
    desc: 'Somente mods presentes na Mod List Oficial podem ser utilizados. Sugestões de novos mods devem ser enviadas à equipe de moderação para avaliação.',
  },
  {
    n: '05',
    icon: 'ti-ban',
    title: 'Proibição de Cheats',
    desc: 'É proibido utilizar softwares, scripts, macros, trainers, cheats, exploits ou qualquer recurso que conceda vantagem indevida durante a competição.',
  },
  {
    n: '06',
    icon: 'ti-lock',
    title: 'Integridade da Partida',
    desc: 'Não é permitido editar saves, restaurar backups após a morte, utilizar comandos administrativos ou modificar arquivos do jogo para alterar a experiência oficial.',
  },
  {
    n: '07',
    icon: 'ti-clipboard-check',
    title: 'Validação da Tentativa',
    desc: 'Todas as partidas devem ser válidas conforme as regras do campeonato e poderão ser auditadas pela organização por meio das gravações e das informações fornecidas pelo PZ-Rank.',
  },
  {
    n: '08',
    icon: 'ti-users',
    title: 'Conduta Esportiva',
    desc: 'Os participantes devem manter uma postura respeitosa com os demais competidores, espectadores e equipe organizadora. Atitudes antidesportivas poderão resultar em punições.',
  },
  {
    n: '09',
    icon: 'ti-alert-triangle',
    title: 'Penalidades',
    desc: 'O descumprimento de qualquer regra poderá resultar em advertência, invalidação da tentativa, desclassificação ou banimento, conforme a gravidade da infração.',
  },
  {
    n: '10',
    icon: 'ti-gavel',
    title: 'Decisão da Organização',
    desc: 'Em casos omissos ou situações não previstas neste regulamento, a decisão final caberá exclusivamente à equipe organizadora do Brasileirão PZ.',
  },
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
                <span>O mod exige versão mínima <strong>v2.13.0</strong>. Mantenha sempre o mod e o Companion atualizados para evitar bloqueio de sync.</span>
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
                  <p className="rg-section-sub">Complete os objetivos abaixo para provar que é um verdadeiro sobrevivente.</p>
                </div>
              </div>

              {/* Objetivos Principais */}
              <h3 className="rg-sub-title">Objetivos Principais</h3>
              <div className="rg-obj-list">
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-skull" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Extermínio Total</span>
                    <span className="rg-obj-desc">Cada zumbi abatido vale <strong>+{SCORE_KILLS_PER_KILL} pt</strong>. Máximo contabilizado: {SCORE_KILLS_MAX.toLocaleString('pt-BR')} zumbis.</span>
                    <span className="rg-pts-badge">até +{Math.round(SCORE_KILLS_MAX * SCORE_KILLS_PER_KILL).toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-star" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Mestre da Sobrevivência</span>
                    <span className="rg-obj-desc">Cada habilidade maximizada ao nível 10 vale <strong>+{SCORE_SKILL_10.toLocaleString('pt-BR')} pts</strong>. O jogo possui 35 habilidades.</span>
                    <span className="rg-pts-badge">até +{(35 * SCORE_SKILL_10).toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-home" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Reconstrução de Kentucky</span>
                    <span className="rg-obj-desc">Estabeleça uma base em cada um dos {SPIFFOS_RESTAURANTS.length} restaurantes Spiffo's. Cada base estabelecida vale <strong>+{SCORE_SPIFFO_DONE.toLocaleString('pt-BR')} pts</strong>.</span>
                    <span className="rg-pts-badge">até +{(SPIFFOS_RESTAURANTS.length * SCORE_SPIFFO_DONE).toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-building-store" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Sede do Spiffo's (Louisville HQ)</span>
                    <span className="rg-obj-desc">Conquiste a Sede do Spiffo's em Louisville, eliminando toda a ameaça zumbi na região.</span>
                    <span className="rg-pts-badge">+{SCORE_SPIFFO_HQ.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-trophy" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Relíquia do Spiffo</span>
                    <span className="rg-obj-desc">Localize e colete a lendária Relíquia do Spiffo — símbolo máximo da sobrevivência.</span>
                    <span className="rg-pts-badge">+{SCORE_SPIFFO_RELIC.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
                <div className="rg-obj-card">
                  <div className="rg-obj-icon"><i className="ti ti-sword" /></div>
                  <div className="rg-obj-body">
                    <span className="rg-obj-title">Operação Base Militar</span>
                    <span className="rg-obj-desc">Conquiste a Base Militar Secreta ao norte de Rosewood, eliminando completamente os zumbis da instalação.</span>
                    <span className="rg-pts-badge">+{SCORE_MILITARY.toLocaleString('pt-BR')} pts</span>
                  </div>
                </div>
              </div>

              {/* Pontuação resumo */}
              <div className="rg-max-score">
                <span className="rg-max-label">Pontuação máxima possível</span>
                <span className="rg-max-value">{MAX_POSSIBLE_SCORE.toLocaleString('pt-BR')} pts</span>
              </div>

              {/* Spiffo's Bases */}
              <h3 className="rg-sub-title">Locais — Reconstrução de Kentucky</h3>
              <div className="rg-restaurants-grid">
                {SPIFFOS_RESTAURANTS.map(r => (
                  <div key={r.id} className="rg-restaurant-chip">
                    <i className="ti ti-map-pin" /> {r.name}
                  </div>
                ))}
              </div>

              <h3 className="rg-sub-title" style={{ marginTop: '1.25rem' }}>Requisitos por Base</h3>
              <p className="rg-spiffos-intro">
                Cada restaurante só é considerado conquistado quando possuir <strong>todos</strong> os requisitos abaixo:
              </p>
              <div className="rg-base-items">
                {BASE_ITEMS.map(item => (
                  <div key={item.id} className="rg-base-item-row">
                    <i className="ti ti-check" />
                    <span>{item.label}</span>
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
                  <h2 className="rg-section-title">10 Regras Fundamentais</h2>
                  <p className="rg-section-sub">As regras que regem a participação no Brasileirão PZ. O cumprimento é obrigatório.</p>
                </div>
              </div>

              <div className="rg-steps">
                {FUNDAMENTAL_RULES.map(rule => (
                  <div key={rule.n} className="rg-step-card">
                    <div className="rg-step-n">{rule.n}</div>
                    <div className="rg-step-body">
                      <div className="rg-step-head">
                        <i className={`ti ${rule.icon} rg-step-icon`} />
                        <h3 className="rg-step-title">{rule.title}</h3>
                      </div>
                      <p className="rg-step-desc">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rg-callout rg-callout--info">
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
