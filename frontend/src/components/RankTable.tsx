import { useNavigate } from 'react-router-dom';
import type { Entry, SortKey, RankTab } from '../types';
import { RankRow } from './RankRow';
import {
  IconGhost,
  IconTrophy,
  IconSkull,
  IconBan,
  IconRefresh,
  IconUserPlus,
  IconHeartbeat,
  IconSword,
  IconCalendar,
  IconClock,
  IconStar,
  IconUser,
} from '@tabler/icons-react';

interface RankTableProps {
  entries:     Entry[];
  sortKey:     SortKey;
  loading:     boolean;
  onSort:      (key: SortKey) => void;
  onRegister:  () => void;
  onReload:    () => void;
  tab:         RankTab;
  onTabChange: (tab: RankTab) => void;
  aliveCount:  number;
  deadCount:   number;
  discCount:   number;
  totalCount:  number;
}

const EMPTY_MESSAGES: Record<RankTab, { icon: React.ReactElement; text: string }> = {
  rank:         { icon: <IconGhost  size={20} />, text: 'Nenhum sobrevivente ativo no momento.\nCadastre-se e aguarde aprovação dos moderadores!' },
  records:      { icon: <IconTrophy size={20} />, text: 'Nenhum registro encontrado ainda.'                                                       },
  dead:         { icon: <IconSkull  size={20} />, text: 'Nenhum sobrevivente foi eliminado ainda.'                                               },
  disqualified: { icon: <IconBan    size={20} />, text: 'Nenhum participante desclassificado.'                                                   },
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
                <IconBan size={16} /> Desc.
              </span>
            )
            : entry.is_alive
              ? <span className="alive-badge alive rc-status"><IconHeartbeat size={16} /> Vivo</span>
              : <span className="alive-badge dead rc-status"><IconSkull size={16} /> Morto</span>
        )}
      </div>

      {/* Score */}
      <div className="rc-score">{entry.score.toLocaleString('pt-BR')} <span className="rc-pts">pts</span></div>

      {/* Stats */}
      <div className="rc-stats">
        <span className="rc-stat"><IconSword size={14} />{entry.kills.toLocaleString('pt-BR')} zumbis</span>
        <span className="rc-stat"><IconCalendar size={14} />{entry.days}d</span>
        {entry.time_str && <span className="rc-stat"><IconClock size={14} />{entry.time_str}</span>}
        {objCount > 0 && <span className="rc-stat rc-obj"><IconStar size={14} />{objCount} obj.</span>}
      </div>

      {/* Player + actions */}
      <div className="rc-footer">
        <span className="rc-player-name"><IconUser size={16} /> {entry.name}</span>
        {entry.player_id && (
          <button className="rc-player-btn" onClick={() => onPlayerClick(entry.player_id!)}>
            <IconUser size={16} /> Ver detalhes
          </button>
        )}
      </div>
    </div>
  );
}

const TAB_CONFIG: { key: RankTab; label: string; countKey: 'aliveCount' | 'deadCount' | 'discCount' | 'totalCount' }[] = [
  { key: 'rank',         label: 'Ranking',          countKey: 'aliveCount'  },
  { key: 'records',      label: 'Recordes',         countKey: 'totalCount'  },
  { key: 'dead',         label: 'Mortos',           countKey: 'deadCount'   },
  { key: 'disqualified', label: 'Desclassificados', countKey: 'discCount'   },
];

export function RankTable({ entries, sortKey, loading, onSort, onRegister, onReload, tab, onTabChange, aliveCount, deadCount, discCount, totalCount }: RankTableProps) {
  const navigate = useNavigate();
  const hideStatus = tab === 'rank';
  const { icon: emptyIcon, text: emptyText } = EMPTY_MESSAGES[tab];
  const counts = { aliveCount, deadCount, discCount, totalCount };

  function handlePlayerClick(playerId: number) {
    navigate(`/player/${playerId}`);
  }

  return (
    <div className="container table-section">
      <div className="rank-tabs-bar">
        {TAB_CONFIG.map(({ key, label, countKey }) => (
          <button key={key}
            className={`rank-tab-btn${tab === key ? ' active' : ''}`}
            onClick={() => onTabChange(key)}>
            {label}
            <span className="rank-tab-badge">{counts[countKey]}</span>
          </button>
        ))}
      </div>

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
            <IconRefresh size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary btn-sm sort-register" onClick={onRegister}>
            <IconUserPlus size={16} aria-hidden="true" /> Cadastrar-se
          </button>
        </div>
      </div>

      {entries.length === 0 && !loading ? (
        <div className="empty-state">
          {emptyIcon}
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