import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetLegends, type Legends, type LegendEntry, type HofSeason } from '../lib/api';

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

interface CardProps {
  icon:      string;
  category:  string;
  color:     string;
  hero?:     boolean;
  entry:     (LegendEntry & Record<string, unknown>) | null;
  statLabel: string;
  statValue: (e: LegendEntry & Record<string, unknown>) => string;
  pending?:  string;
}

function LegendCard({ icon, category, color, hero, entry, statLabel, statValue, pending }: CardProps) {
  const displayName = entry ? (entry.character_name || entry.entry_name as string || entry.name) : null;
  const playerNick  = entry ? (entry.entry_name as string ?? entry.name) : null;
  const isDifferent = displayName && playerNick && displayName !== playerNick;

  return (
    <div className={`legend-card${hero ? ' legend-card--hero' : ''}`} style={{ '--legend-color': color } as React.CSSProperties}>
      <div className="legend-top-bar" />
      <div className="legend-icon">{icon}</div>
      <div className="legend-category">{category}</div>

      {entry ? (
        <>
          <div className="legend-player-block">
            <span className="legend-char-name">{displayName}</span>
            {isDifferent && <span className="legend-nick">{playerNick}</span>}
            {typeof entry['season_name'] === 'string' && entry['season_name'] && (
              <span className="legend-season-tag">{entry['season_name']}</span>
            )}
          </div>

          <div className="legend-stat-block">
            <span className="legend-stat-value">{statValue(entry)}</span>
            <span className="legend-stat-label">{statLabel}</span>
          </div>

          <div className="legend-secondary">
            <span><i className="ti ti-calendar" /> {entry.days}d</span>
            <span><i className="ti ti-sword" /> {fmt(entry.kills)}</span>
            <span><i className="ti ti-star" /> {fmt(entry.score)} pts</span>
          </div>

          {entry.player_id && (
            <Link to={`/player/${entry.player_id}`} className="legend-profile-link">
              Ver perfil <i className="ti ti-arrow-right" />
            </Link>
          )}
        </>
      ) : (
        <div className="legend-pending">
          <i className="ti ti-hourglass-empty" />
          <span>{pending ?? 'Aguardando dados...'}</span>
        </div>
      )}
    </div>
  );
}

const POSITION_LABEL: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: '1º lugar', icon: '🥇', color: '#c8a84b' },
  2: { label: '2º lugar', icon: '🥈', color: '#9099a5' },
  3: { label: '3º lugar', icon: '🥉', color: '#a0623a' },
};

function HofSeasonBlock({ season }: { season: HofSeason }) {
  return (
    <div className="hof-season-block">
      <div className="hof-season-name">
        <i className="ti ti-trophy" />
        {season.season_name ?? `Temporada ${season.season_id}`}
      </div>
      <div className="hof-podium">
        {season.podium.map(entry => {
          const pos  = POSITION_LABEL[entry.position] ?? { label: `${entry.position}º`, icon: '🏅', color: 'var(--text-3)' };
          const name = entry.character_name || entry.entry_name;
          const nick = entry.entry_name;
          return (
            <div key={entry.position} className="hof-row" style={{ '--hof-color': pos.color } as React.CSSProperties}>
              <span className="hof-position">{pos.icon}</span>
              <div className="hof-names">
                <span className="hof-char">{name}</span>
                {name !== nick && <span className="hof-nick">{nick}</span>}
              </div>
              <div className="hof-stats">
                <span><i className="ti ti-calendar" /> {entry.days}d</span>
                <span><i className="ti ti-sword" /> {fmt(entry.kills)}</span>
                <span><i className="ti ti-star" /> {fmt(entry.score)} pts</span>
              </div>
              {entry.player_id && (
                <Link to={`/player/${entry.player_id}`} className="hof-link">
                  <i className="ti ti-arrow-right" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CardDef = {
  icon:      string;
  category:  string;
  color:     string;
  hero?:     boolean;
  key:       keyof Legends;
  statLabel: string;
  statValue: (e: LegendEntry & Record<string, unknown>) => string;
  pending:   string;
};

const SURVIVAL_CARDS: CardDef[] = [
  {
    icon:      '🎣',
    category:  'Maior Pescador',
    color:     '#4c8aff',
    key:       'most_fish',
    statLabel: 'peixes capturados',
    statValue: e => fmt(e['fish_caught'] as number ?? 0),
    pending:   'Ninguém pescou ainda.',
  },
  {
    icon:      '🍖',
    category:  'Maior Caçador',
    color:     '#c06030',
    key:       'most_animals',
    statLabel: 'animais abatidos',
    statValue: e => fmt(e['animals_killed'] as number ?? 0),
    pending:   'Ninguém caçou ainda.',
  },
  {
    icon:      '🥚',
    category:  'Coletor de Ovos',
    color:     '#e8c84a',
    key:       'most_eggs',
    statLabel: 'ovos coletados',
    statValue: e => fmt(e['eggs_collected'] as number ?? 0),
    pending:   'Ninguém coletou ovos ainda.',
  },
  {
    icon:      '🥛',
    category:  'Maior Leiteiro',
    color:     '#b0b8c0',
    key:       'most_milk',
    statLabel: 'leite produzido',
    statValue: e => fmt(e['milk_produced'] as number ?? 0),
    pending:   'Ninguém produziu leite ainda.',
  },
  {
    icon:      '😴',
    category:  'Mais Insone',
    color:     '#9b59b6',
    key:       'most_sleepless',
    statLabel: 'horas sem dormir',
    statValue: e => `${fmt(e['hours_without_sleep'] as number ?? 0)}h`,
    pending:   'Ninguém ficou sem dormir por muito tempo ainda.',
  },
  {
    icon:      '🚗',
    category:  'Maior Motorista',
    color:     '#e67e22',
    key:       'most_km_driven',
    statLabel: 'km percorridos de carro',
    statValue: e => `${fmt(e['km_driven'] as number ?? 0)} km`,
    pending:   'Ninguém percorreu km de carro ainda.',
  },
  {
    icon:      '⚒️',
    category:  'Maior Produtor',
    color:     '#7f8c8d',
    key:       'most_materials',
    statLabel: 'materiais produzidos',
    statValue: e => fmt(e['materials_crafted'] as number ?? 0),
    pending:   'Ninguém produziu materiais ainda.',
  },
  {
    icon:      '🍳',
    category:  'Maior Cozinheiro',
    color:     '#e74c3c',
    key:       'most_meals',
    statLabel: 'refeições preparadas',
    statValue: e => fmt(e['meals_cooked'] as number ?? 0),
    pending:   'Ninguém cozinhou ainda.',
  },
  {
    icon:      '🪵',
    category:  'Maior Lenhador',
    color:     '#8b6540',
    key:       'most_trees',
    statLabel: 'árvores cortadas',
    statValue: e => fmt(e['trees_cut'] as number ?? 0),
    pending:   'Ninguém cortou árvores ainda.',
  },
  {
    icon:      '🏗️',
    category:  'Maior Construtor',
    color:     '#3498db',
    key:       'most_structures',
    statLabel: 'estruturas construídas',
    statValue: e => fmt(e['structures_built'] as number ?? 0),
    pending:   'Ninguém construiu estruturas ainda.',
  },
];

const SEASON_CARDS: CardDef[] = [
  {
    icon:      '👑',
    category:  'Líder da Temporada',
    color:     '#c8a84b',
    hero:      true,
    key:       'current_leader',
    statLabel: 'pontos — vivo agora',
    statValue: e => fmt(e.score),
    pending:   'Nenhum sobrevivente ativo no momento.',
  },
  {
    icon:      '⚔️',
    category:  'Maior Exterminador',
    color:     '#e04040',
    key:       'most_kills',
    statLabel: 'zumbis abatidos',
    statValue: e => fmt(e.kills),
    pending:   'Nenhuma entry registrada ainda.',
  },
  {
    icon:      '🏕️',
    category:  'Maior Sobrevivente',
    color:     '#9099a5',
    key:       'most_days',
    statLabel: 'dias sobrevividos',
    statValue: e => `${e.days}d`,
    pending:   'Nenhuma entry registrada ainda.',
  },
  {
    icon:      '🏆',
    category:  'Maior Pontuação',
    color:     '#7ac050',
    key:       'highest_score',
    statLabel: 'pontos no ranking',
    statValue: e => fmt(e.score),
    pending:   'Nenhuma entry registrada ainda.',
  },
  {
    icon:      '🧬',
    category:  'Mais Habilidades Maxadas',
    color:     '#6eb5ff',
    key:       'most_skills_10',
    statLabel: 'habilidades no nível 10',
    statValue: e => String((e as unknown as { skills10_count: number }).skills10_count ?? 0),
    pending:   'Nenhum jogador com habilidade nível 10 ainda.',
  },
  {
    icon:      '🦝',
    category:  'Rei dos Spiffos',
    color:     '#e8882a',
    key:       'most_spiffo_bases',
    statLabel: 'bases Spiffo\'s estabelecidas',
    statValue: e => String((e as unknown as { spiffo_count: number }).spiffo_count ?? 0),
    pending:   'Nenhuma base Spiffo\'s conquistada ainda.',
  },
  {
    icon:      '🪖',
    category:  'Base Militar',
    color:     '#7db87d',
    key:       'military_base_holder',
    statLabel: 'primeiro a conquistar a base militar',
    statValue: () => 'Conquistado',
    pending:   'Nenhum jogador conquistou a base militar ainda.',
  },
];

export function LegendsPage() {
  const [legends, setLegends] = useState<Legends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    apiGetLegends()
      .then(setLegends)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const hasHof = (legends?.hall_of_fame?.length ?? 0) > 0;

  return (
    <div className="legends-page">
      <div className="container">
        <div className="legends-header">
          <Link to="/" className="legends-back">
            <i className="ti ti-arrow-left" /> Voltar ao Ranking
          </Link>
          <h1 className="legends-title">
            <i className="ti ti-award" /> Lendas do Brasileirão
          </h1>
          <p className="legends-sub">
            Maiores marcos da temporada e conquistas que ficam para sempre.
          </p>
        </div>

        {loading && (
          <div className="legends-loading">
            <i className="ti ti-loader-2 spin" /> Carregando lendas...
          </div>
        )}

        {error && (
          <div className="legends-error">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}

        {!loading && !error && legends && (
          <>
            <div className="legends-section">
              <div className="legends-section-head">
                <span className="legends-section-title">Marcos da Temporada</span>
                <div className="legends-section-line" />
              </div>
              <div className="legends-grid legends-grid--season">
                {SEASON_CARDS.map(card => (
                  <LegendCard
                    key={card.key}
                    icon={card.icon}
                    category={card.category}
                    color={card.color}
                    hero={card.hero}
                    entry={legends[card.key] as (LegendEntry & Record<string, unknown>) | null}
                    statLabel={card.statLabel}
                    statValue={card.statValue}
                    pending={card.pending}
                  />
                ))}
              </div>
            </div>

            <div className="legends-section">
              <div className="legends-section-head">
                <span className="legends-section-title">Recordes de Sobrevivência</span>
                <div className="legends-section-line" />
              </div>
              <div className="legends-grid legends-grid--survival">
                {SURVIVAL_CARDS.map(card => (
                  <LegendCard
                    key={card.key}
                    icon={card.icon}
                    category={card.category}
                    color={card.color}
                    entry={legends[card.key] as (LegendEntry & Record<string, unknown>) | null}
                    statLabel={card.statLabel}
                    statValue={card.statValue}
                    pending={card.pending}
                  />
                ))}
              </div>
            </div>

            <div className="legends-section">
              <div className="legends-section-head">
                <span className="legends-section-title">Hall da Fama</span>
                <div className="legends-section-line" />
              </div>
              {hasHof ? (
                <div className="hof-list">
                  {legends.hall_of_fame.map(season => (
                    <HofSeasonBlock key={season.season_id} season={season} />
                  ))}
                </div>
              ) : (
                <div className="legends-pending legends-pending--hof">
                  <i className="ti ti-hourglass-empty" />
                  <p>O Hall da Fama será preenchido ao fim da primeira temporada.</p>
                  <p>O pódio (top 3) de cada temporada encerrada ficará registrado aqui para sempre.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
