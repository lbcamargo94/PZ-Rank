import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetLegends, type Legends, type LegendEntry } from '../lib/api';

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

interface CardProps {
  icon:        string;
  category:    string;
  color:       string;
  entry:       (LegendEntry & { entry_name?: string; season_name?: string | null }) | null;
  statLabel:   string;
  statValue:   (e: LegendEntry) => string;
  pending?:    string;
}

function LegendCard({ icon, category, color, entry, statLabel, statValue, pending }: CardProps) {
  const displayName  = entry ? (entry.character_name || entry.entry_name || entry.name) : null;
  const playerNick   = entry ? (entry.entry_name ?? entry.name) : null;
  const isDifferent  = displayName && playerNick && displayName !== playerNick;

  return (
    <div className="legend-card" style={{ '--legend-color': color } as React.CSSProperties}>
      <div className="legend-top-bar" />
      <div className="legend-icon">{icon}</div>
      <div className="legend-category">{category}</div>

      {entry ? (
        <>
          <div className="legend-player-block">
            <span className="legend-char-name">{displayName}</span>
            {isDifferent && <span className="legend-nick">{playerNick}</span>}
            {'season_name' in entry && entry.season_name && (
              <span className="legend-season-tag">{entry.season_name}</span>
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

const CARDS = [
  {
    icon:      '👑',
    category:  'Primeiro Campeão',
    color:     '#c8a84b',
    key:       'first_champion' as const,
    statLabel: 'campeão da temporada',
    statValue: (e: LegendEntry & { season_name?: string | null }) => e.season_name ?? 'Temporada —',
    pending:   'Aguardando o encerramento da primeira temporada.',
  },
  {
    icon:      '⚔️',
    category:  'Maior Exterminador',
    color:     '#e04040',
    key:       'most_kills' as const,
    statLabel: 'zumbis abatidos',
    statValue: (e: LegendEntry) => fmt(e.kills),
    pending:   'Nenhuma entry registrada ainda.',
  },
  {
    icon:      '💀',
    category:  'Maior Sobrevivente',
    color:     '#9099a5',
    key:       'most_days' as const,
    statLabel: 'dias sobrevividos',
    statValue: (e: LegendEntry) => `${e.days}d`,
    pending:   'Nenhuma entry registrada ainda.',
  },
  {
    icon:      '🏆',
    category:  'Maior Pontuação',
    color:     '#7ac050',
    key:       'highest_score' as const,
    statLabel: 'pontos no ranking',
    statValue: (e: LegendEntry) => fmt(e.score),
    pending:   'Nenhuma entry registrada ainda.',
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
            Recordes históricos do desafio — conquistas que ficam para sempre.
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
          <div className="legends-grid">
            {CARDS.map(card => (
              <LegendCard
                key={card.key}
                icon={card.icon}
                category={card.category}
                color={card.color}
                entry={legends[card.key] as (LegendEntry & { entry_name?: string; season_name?: string | null }) | null}
                statLabel={card.statLabel}
                statValue={card.statValue as (e: LegendEntry) => string}
                pending={card.pending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
