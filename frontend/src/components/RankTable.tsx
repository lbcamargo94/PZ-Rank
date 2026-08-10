import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entry, SortKey, RankTab } from '../types';
import { RankRow, KILLS_TARGET } from './RankRow';
import { MAX_POSSIBLE_SCORE } from '../lib/objectives';

type PageSize = 15 | 50 | 'all';
const PAGE_SIZES: { value: PageSize; label: string }[] = [
  { value: 15,    label: '15'   },
  { value: 50,    label: '50'   },
  { value: 'all', label: 'Tudo' },
];

interface RankTableProps {
  entries:      Entry[];
  sortKey:      SortKey;
  loading:      boolean;
  onSort:       (key: SortKey) => void;
  onReload:     () => void;
  tab:          RankTab;
  iconOnly?:    boolean;
  isSearching?: boolean;
}

const EMPTY_MESSAGES: Record<RankTab, { icon: string; text: string }> = {
  rank:         { icon: 'ti-ghost',      text: 'Nenhum sobrevivente ativo no momento.\nCadastre-se para entrar no ranking!' },
  records:      { icon: 'ti-trophy',     text: 'Nenhum registro encontrado ainda.'                                                       },
  dead:         { icon: 'ti-skull',      text: 'Nenhum sobrevivente foi eliminado ainda.'                                               },
  disqualified: { icon: 'ti-ban',        text: 'Nenhum participante desclassificado.'                                                   },
};

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'score',      label: 'Pontos'      },
  { key: 'days',       label: 'Dias vivo'   },
  { key: 'kills',      label: 'Zumbis'      },
  { key: 'skills',     label: 'Habilidades' },
  { key: 'updated_at', label: 'Atualização' },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const DISQ_TOOLTIPS: Record<string, string> = {
  sandbox:     'Configurações do sandbox divergem do desafio oficial',
  debug:       'Jogador utilizou modo debug durante o desafio Brasileirão',
  mods:        'Jogador utilizou mods não permitidos no desafio Brasileirão',
  manual:      'Desclassificado manualmente pelo moderador',
  mod_removed: 'Companion detectou que o mod foi removido enquanto o jogo rodava',
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const hh  = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear() + ' - ' + hh + ':' + min;
}

function MiniBar({ value, max, done }: { value: number; max: number; done?: boolean }) {
  const raw = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="rk-bar-row">
      <div className="rk-bar-track">
        <div className={`rk-bar-fill${done ? ' rk-bar-done' : ''}`} style={{ width: raw + '%' }} />
      </div>
      <span className={`rk-bar-pct${done ? ' rk-bar-pct-done' : ''}`}>{raw.toFixed(2)}%</span>
    </div>
  );
}

function RankCard({ entry, rank, onPlayerClick, hideStatus }: {
  entry: Entry;
  rank: number;
  onPlayerClick: (id: number) => void;
  hideStatus?: boolean;
}) {
  const objCount = entry.objectives
    ? [
        entry.objectives.spiffo_hq,
        entry.objectives.spiffo_relic,
        entry.objectives.military_base,
        ...Object.values(entry.objectives.bases ?? {}).map(b => b.has_base),
      ].filter(Boolean).length
    : 0;

  const killsDone = entry.kills >= KILLS_TARGET;

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
              <span className="alive-badge disqualified rc-status" title={DISQ_TOOLTIPS[entry.disqualification_reason ?? 'sandbox'] ?? DISQ_TOOLTIPS.sandbox}>
                <i className="ti ti-ban" /> Desc.
              </span>
            )
            : entry.is_alive
              ? <span className="alive-badge alive rc-status"><i className="ti ti-heartbeat" /> Vivo</span>
              : <span className="alive-badge dead rc-status"><i className="ti ti-skull" /> Morto</span>
        )}
      </div>

      {/* Score + bar */}
      <div className="rc-score">
        <span>{entry.score.toLocaleString('pt-BR')} <span className="rc-pts">pts</span></span>
        <MiniBar value={entry.score ?? 0} max={MAX_POSSIBLE_SCORE} />
      </div>

      {/* Stats */}
      <div className="rc-stats">
        <div className="rc-stat-kills">
          <span className="rc-stat"><i className="ti ti-sword" />{entry.kills.toLocaleString('pt-BR')} zumbis</span>
          <MiniBar value={entry.kills} max={KILLS_TARGET} done={killsDone} />
        </div>
        <span className="rc-stat"><i className="ti ti-calendar" />{entry.days}d</span>
        {entry.time_str && <span className="rc-stat"><i className="ti ti-clock" />{entry.time_str}</span>}
        {objCount > 0 && <span className="rc-stat rc-obj"><i className="ti ti-star" />{objCount} obj.</span>}
      </div>
      {(entry.updated_at ?? entry.created_at) && (
        <div className="rc-updated"><i className="ti ti-clock-edit" />{fmtDate(entry.updated_at ?? entry.created_at)}</div>
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

// Helper: monta lista de páginas com elipses para o pagination bar
function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3)           pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2)   pages.push('…');
  pages.push(total);
  return pages;
}

export function RankTable({ entries, sortKey, loading, onSort, onReload, tab, iconOnly, isSearching }: RankTableProps) {
  const navigate = useNavigate();
  const hideStatus = false;
  const { icon: emptyIcon, text: emptyText } = EMPTY_MESSAGES[isSearching ? 'rank' : tab];

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);

  // Volta para pág 1 quando os entries mudam (tab ou busca)
  useEffect(() => { setPage(1); }, [entries, pageSize]);

  const totalPages   = pageSize === 'all' ? 1 : Math.ceil(entries.length / pageSize);
  const numPageSize  = pageSize === 'all' ? entries.length : pageSize;
  const start        = entries.length === 0 ? 0 : (page - 1) * numPageSize + 1;
  const end          = Math.min(page * numPageSize, entries.length);
  const visibleEntries = pageSize === 'all'
    ? entries
    : entries.slice((page - 1) * numPageSize, page * numPageSize);

  // Offset de rank: para mostrar posição global correta mesmo em páginas além da 1
  const rankOffset = (page - 1) * numPageSize;

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
          <div className="page-size-sep" aria-hidden="true" />
          <span className="sort-label">Exibir:</span>
          {PAGE_SIZES.map(({ value, label }) => (
            <button key={String(value)}
              className={`sort-btn${pageSize === value ? ' active' : ''}`}
              onClick={() => setPageSize(value)}
              aria-pressed={pageSize === value}>
              {label}
            </button>
          ))}
          <div className="page-size-sep" aria-hidden="true" />
          <button className="btn-reload" onClick={onReload} disabled={loading} aria-label="Recarregar tabela">
            <i className={`ti ti-refresh${loading ? ' spin' : ''}`} />
          </button>
        </div>
      </div>

      {entries.length === 0 && !loading ? (
        <div className="empty-state">
          <i className={`ti ${emptyIcon}`} aria-hidden="true" />
          <p>{isSearching
            ? 'Nenhum resultado encontrado para a busca.'
            : emptyText.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && emptyText.includes('\n') ? <br /> : ''}</span>)
          }</p>
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
                  <th>Zumbis</th>
                  <th>Habilidades</th>
                  <th>Atualizado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry, i) => {
                  const globalIdx = rankOffset + i;
                  const displayRank = entry.is_test_mod
                    ? (globalIdx === 0 ? 0 : globalIdx)
                    : globalIdx + 1;
                  return <RankRow key={entry.id} entry={entry} rank={displayRank} hideStatus={hideStatus} iconOnly={iconOnly} />;
                })}
              </tbody>
            </table>

            {/* Paginação */}
            {entries.length > 0 && pageSize !== 'all' && (
              <div className="rank-pagination">
                <span className="rank-pagination-info">
                  {entries.length === 0 ? '0 resultados' : `${start}–${end} de ${entries.length}`}
                </span>
                {totalPages > 1 && (
                  <div className="rank-pagination-controls">
                    <button
                      className="pag-btn"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      aria-label="Página anterior"
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                    <div className="pag-pages">
                      {buildPageList(page, totalPages).map((p, i) =>
                        p === '…'
                          ? <span key={`e${i}`} className="pag-ellipsis">…</span>
                          : <button
                              key={p}
                              className={`pag-page-btn${page === p ? ' active' : ''}`}
                              onClick={() => setPage(p as number)}
                              aria-current={page === p ? 'page' : undefined}
                            >{p}</button>
                      )}
                    </div>
                    <button
                      className="pag-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      aria-label="Próxima página"
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className={`rank-cards${loading ? ' table-loading' : ''}`}>
            {visibleEntries.map((entry, i) => {
              const globalIdx = rankOffset + i;
              const displayRank = entry.is_test_mod
                ? (globalIdx === 0 ? 0 : globalIdx)
                : globalIdx + 1;
              return (
                <RankCard
                  key={entry.id}
                  entry={entry}
                  rank={displayRank}
                  onPlayerClick={handlePlayerClick}
                  hideStatus={hideStatus}
                />
              );
            })}
            {entries.length > 0 && pageSize !== 'all' && (
              <div className="rank-pagination">
                <span className="rank-pagination-info">{start}–{end} de {entries.length}</span>
                {totalPages > 1 && (
                  <div className="rank-pagination-controls">
                    <button className="pag-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <i className="ti ti-chevron-left" />
                    </button>
                    <span className="rank-pagination-info">Pág {page}/{totalPages}</span>
                    <button className="pag-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <i className="ti ti-chevron-right" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}