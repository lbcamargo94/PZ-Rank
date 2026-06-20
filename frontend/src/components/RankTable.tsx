import { useNavigate } from 'react-router-dom';
import type { Entry, SortKey } from '../types';
import { RankRow } from './RankRow';

interface RankTableProps {
  entries:    Entry[];
  sortKey:    SortKey;
  loading:    boolean;
  onSort:     (key: SortKey) => void;
  onRegister: () => void;
  onReload:   () => void;
}

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Pontos'  },
  { key: 'days',  label: 'Dias'    },
  { key: 'kills', label: 'Zumbis'  },
  { key: 'time',  label: 'Tempo'   },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankCard({ entry, rank, onPlayerClick }: {
  entry: Entry;
  rank: number;
  onPlayerClick: (id: number) => void;
}) {
  const objCount = entry.objectives
    ? [
        entry.objectives.kills_500k,
        entry.objectives.all_skills_10,
        entry.objectives.spiffo_statue,
        entry.objectives.military_base,
        ...Object.values(entry.objectives.bases ?? {}).map(b => b.has_base),
      ].filter(Boolean).length
    : 0;

  return (
    <div
      className={`rank-card${rank <= 3 ? ` rank-card-top rank-card-${rank}` : ''}`}
      role="article"
    >
      {/* Top row */}
      <div className="rc-top">
        <span className="rc-rank">{MEDALS[rank] ?? `#${rank}`}</span>
        <div className="rc-identity">
          <span className="rc-char-name">{entry.character_name || entry.name}</span>
          {entry.profession && <span className="profession-badge">{entry.profession}</span>}
        </div>
        {entry.is_alive
          ? <span className="alive-badge alive rc-status"><i className="ti ti-heartbeat" /> Vivo</span>
          : <span className="alive-badge dead rc-status"><i className="ti ti-skull" /> Morto</span>}
      </div>

      {/* Score */}
      <div className="rc-score">{entry.score.toLocaleString('pt-BR')} <span className="rc-pts">pts</span></div>

      {/* Stats */}
      <div className="rc-stats">
        <span className="rc-stat"><i className="ti ti-sword" />{entry.kills.toLocaleString('pt-BR')} zumbis</span>
        <span className="rc-stat"><i className="ti ti-calendar" />{entry.days}d</span>
        {entry.time_str && <span className="rc-stat"><i className="ti ti-clock" />{entry.time_str}</span>}
        {objCount > 0 && <span className="rc-stat rc-obj"><i className="ti ti-star" />{objCount} obj.</span>}
      </div>

      {/* Player + actions */}
      <div className="rc-footer">
        {entry.player_id ? (
          <button className="rc-player-btn" onClick={() => onPlayerClick(entry.player_id!)}>
            <i className="ti ti-user" /> {entry.name}
          </button>
        ) : (
          <span className="rc-player-name"><i className="ti ti-user" /> {entry.name}</span>
        )}
        {entry.live_url && (
          <a href={entry.live_url} target="_blank" rel="noopener noreferrer" className="rc-live-btn">
            <i className="ti ti-brand-twitch" />
          </a>
        )}
      </div>
    </div>
  );
}

export function RankTable({ entries, sortKey, loading, onSort, onRegister, onReload }: RankTableProps) {
  const navigate = useNavigate();

  function handlePlayerClick(playerId: number) {
    navigate(`/player/${playerId}`);
  }

  return (
    <div className="container table-section">
      <div className="sort-bar">
        <span className="sort-label">Ordenar por:</span>
        {SORT_LABELS.map(({ key, label }) => (
          <button key={key}
            className={`sort-btn${sortKey === key ? ' active' : ''}`}
            onClick={() => onSort(key)}
            aria-pressed={sortKey === key}>
            {label}
          </button>
        ))}
        <div className="sort-bar-actions">
          <button className="btn-reload" onClick={onReload} disabled={loading} aria-label="Recarregar tabela">
            <i className={`ti ti-refresh${loading ? ' spin' : ''}`} />
          </button>
          <button className="btn-primary btn-sm sort-register" onClick={onRegister}>
            <i className="ti ti-user-plus" aria-hidden="true" /> Cadastrar-se
          </button>
        </div>
      </div>

      {entries.length === 0 && !loading ? (
        <div className="empty-state">
          <i className="ti ti-ghost" aria-hidden="true" />
          <p>Nenhum sobrevivente registrado ainda.<br />Cadastre-se e aguarde aprovação dos moderadores!</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className={`table-wrapper rank-table-desktop${loading ? ' table-loading' : ''}`}>
            <table className="rank-table" aria-label="Ranking de sobrevivência">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jogador</th>
                  <th>Status</th>
                  <th>Pontos</th>
                  <th>Dias</th>
                  <th>Tempo</th>
                  <th>Zumbis</th>
                  <th>Habilidades</th>
                  <th>Live</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <RankRow key={entry.id} entry={entry} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={`rank-cards${loading ? ' table-loading' : ''}`}>
            {entries.map((entry, i) => (
              <RankCard
                key={entry.id}
                entry={entry}
                rank={i + 1}
                onPlayerClick={handlePlayerClick}
              />
            ))}
          </div>
        </>
      )}

      <footer className="site-footer-bottom">
        <p>PZ Community Rank &copy; {new Date().getFullYear()} — Projeto da comunidade</p>
      </footer>
    </div>
  );
}
