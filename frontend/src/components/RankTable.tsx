import { useNavigate } from 'react-router-dom';
import type { Entry, SortKey, RankTab } from '../types';
import { RankRow } from './RankRow';

interface RankTableProps {
  entries:    Entry[];
  sortKey:    SortKey;
  loading:    boolean;
  onSort:     (key: SortKey) => void;
  onRegister: () => void;
  onReload:   () => void;
  tab:        RankTab;
}

const EMPTY_MESSAGES: Record<RankTab, { icon: string; text: string }> = {
  rank:         { icon: 'ti-ghost',      text: 'Nenhum sobrevivente ativo no momento.\nCadastre-se e aguarde aprovação dos moderadores!' },
  records:      { icon: 'ti-trophy',     text: 'Nenhum registro encontrado ainda.'                                                       },
  dead:         { icon: 'ti-skull',      text: 'Nenhum sobrevivente foi eliminado ainda.'                                               },
  disqualified: { icon: 'ti-ban',        text: 'Nenhum participante desclassificado.'                                                   },
};

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Pontos'  },
  { key: 'days',  label: 'Dias'    },
  { key: 'kills', label: 'Zumbis'  },
  { key: 'time',  label: 'Tempo'   },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankCard({ entry, rank, onPlayerClick, hideStatus }: {
  entry: Entry;
  rank: number;
  onPlayerClick: (id: number) => void;
  hideStatus?: boolean;
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
        {!hideStatus && (
          entry.sandbox_ok === false
            ? (
              <span className="alive-badge disqualified rc-status" title="Configurações do sandbox divergem do desafio oficial">
                <i className="ti ti-ban" /> Desc.
              </span>
            )
            : entry.is_alive
              ? <span className="alive-badge alive rc-status"><i className="ti ti-heartbeat" /> Vivo</span>
              : <span className="alive-badge dead rc-status"><i className="ti ti-skull" /> Morto</span>
        )}
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
      {entry.updated_at && (
        <div className="rc-updated"><i className="ti ti-clock-edit" />{(() => { const d = new Date(entry.updated_at); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const hh = String(d.getHours()).padStart(2,'0'); const min = String(d.getMinutes()).padStart(2,'0'); return `${dd}/${mm}/${d.getFullYear()} - ${hh}:${min}`; })()}</div>
      )}

      {/* Player + actions */}
      <div className="rc-footer">
        <span className="rc-player-name"><i className="ti ti-user" /> {entry.name}</span>
        {entry.player_id && (
          <button className="rc-player-btn" onClick={() => onPlayerClick(entry.player_id!)}>
            <i className="ti ti-user" /> Ver detalhes
          </button>
        )}
      </div>
    </div>
  );
}

export function RankTable({ entries, sortKey, loading, onSort, onRegister, onReload, tab }: RankTableProps) {
  const navigate = useNavigate();
  const hideStatus = tab === 'rank';
  const { icon: emptyIcon, text: emptyText } = EMPTY_MESSAGES[tab];

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
          <i className={`ti ${emptyIcon}`} aria-hidden="true" />
          <p>{emptyText.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && emptyText.includes('\n') ? <br /> : ''}</span>)}</p>
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
                  {!hideStatus && <th>Status</th>}
                  <th>Pontos</th>
                  <th>Dias</th>
                  <th>Tempo</th>
                  <th>Zumbis</th>
                  <th>Habilidades</th>
                  <th>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <RankRow key={entry.id} entry={entry} rank={i + 1} hideStatus={hideStatus} />
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
                hideStatus={hideStatus}
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