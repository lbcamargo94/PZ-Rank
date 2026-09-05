import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Entry, SortKey, RankTab, LiveStatus } from '../types';
import { RankRow, KILLS_TARGET } from './RankRow';
import { MAX_POSSIBLE_SCORE } from '../lib/objectives';
import { formatNumber, formatDateTime } from '../lib/format';
import { LiveBadges } from './LiveBadges';

type PageSize = 15 | 50 | 'all';
const PAGE_SIZES: { value: PageSize; labelKey: string | null }[] = [
  { value: 15,    labelKey: null },
  { value: 50,    labelKey: null },
  { value: 'all', labelKey: 'rank.display.all' },
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
  liveMap?:     Map<number, LiveStatus[]>;
  updatedIds?:  Set<number>;
  rankMap?:     Map<number, number>;
}

const EMPTY_ICONS: Record<RankTab, string> = {
  rank:         'ti-ghost',
  records:      'ti-trophy',
  dead:         'ti-skull',
  disqualified: 'ti-ban',
};

const SORT_KEYS: { key: SortKey; labelKey: string }[] = [
  { key: 'score',      labelKey: 'rank.sort.score'      },
  { key: 'days',       labelKey: 'rank.sort.days'       },
  { key: 'kills',      labelKey: 'rank.sort.kills'      },
  { key: 'skills',     labelKey: 'rank.sort.skills'     },
  { key: 'updated_at', labelKey: 'rank.sort.updated_at' },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function disqTooltip(t: TFunction, reason: string | null | undefined): string {
  switch (reason) {
    case 'debug':       return t('rank.disq.debug');
    case 'mods':        return t('rank.disq.mods');
    case 'manual':      return t('rank.disq.manual');
    case 'mod_removed': return t('rank.disq.mod_removed');
    default:             return t('rank.disq.sandbox');
  }
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return formatDateTime(iso);
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

function RankCard({ entry, rank, onPlayerClick, hideStatus, live, isUpdated }: {
  entry: Entry;
  rank: number;
  onPlayerClick: (id: number) => void;
  hideStatus?: boolean;
  live?: LiveStatus[];
  isUpdated?: boolean;
}) {
  const { t } = useTranslation();
  const objCount = entry.objectives
    ? [
        entry.objectives.spiffo_hq,
        entry.objectives.spiffo_relic,
        entry.objectives.military_base,
        ...Object.values(entry.objectives.bases ?? {}).map(b => b.has_base),
      ].filter(Boolean).length
    : 0;

  const killsDone = entry.kills >= KILLS_TARGET;
  const clickable = entry.player_id != null;

  return (
    <div
      className={`rank-card${rank <= 3 ? ` rank-card-top rank-card-${rank}` : ''}${clickable ? ' rank-card-clickable' : ''}`}
      role={clickable ? 'button' : 'article'}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onPlayerClick(entry.player_id!) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlayerClick(entry.player_id!); } } : undefined}
    >
      {/* Top row */}
      <div className="rc-top">
        {entry.is_test_mod
          ? <span className="test-mod-badge rc-rank" title={t('rank.test_mod_title')}><i className="ti ti-microscope" /> {t('rank.test_mod')}</span>
          : <span className="rc-rank">{MEDALS[rank] ?? `#${rank}`}</span>
        }
        <div className="rc-identity">
          <span className="rc-char-name">
            <LiveBadges live={live} />
            {entry.character_name || entry.name}
          </span>
          {entry.profession && <span className="profession-badge">{entry.profession}</span>}
        </div>
        {!hideStatus && (
          entry.sandbox_ok === false
            ? (
              <span className="alive-badge disqualified rc-status" title={disqTooltip(t, entry.disqualification_reason)}>
                <i className="ti ti-ban" /> {t('rank.status.disqualified_short')}
              </span>
            )
            : entry.is_alive
              ? <span className="alive-badge alive rc-status"><i className="ti ti-heartbeat" /> {t('rank.status.alive')}</span>
              : <span className="alive-badge dead rc-status"><i className="ti ti-skull" /> {t('rank.status.dead')}</span>
        )}
      </div>

      {/* Score + bar */}
      <div className="rc-score">
        <span className={isUpdated ? 'stat-flash' : ''}>{formatNumber(entry.score)} <span className="rc-pts">{t('rank.pts')}</span></span>
        <MiniBar value={entry.score ?? 0} max={MAX_POSSIBLE_SCORE} />
      </div>

      {/* Stats */}
      <div className="rc-stats">
        <div className="rc-stat-kills">
          <span className={`rc-stat${isUpdated ? ' stat-flash' : ''}`}><i className="ti ti-sword" />{formatNumber(entry.kills)} {t('rank.zombies_suffix')}</span>
          <MiniBar value={entry.kills} max={KILLS_TARGET} done={killsDone} />
        </div>
        <span className="rc-stat"><i className="ti ti-calendar" />{entry.days}d</span>
        {entry.time_str && <span className="rc-stat"><i className="ti ti-clock" />{entry.time_str}</span>}
        {objCount > 0 && <span className="rc-stat rc-obj"><i className="ti ti-star" />{objCount} {t('rank.obj_suffix')}</span>}
      </div>
      {(entry.updated_at ?? entry.created_at) && (
        <div className="rc-updated"><i className="ti ti-clock-edit" />{fmtDate(entry.updated_at ?? entry.created_at)}</div>
      )}

      {/* Player */}
      <div className="rc-footer">
        <span className="rc-player-name"><i className="ti ti-user" /> {entry.name}</span>
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

export function RankTable({ entries, sortKey, loading, onSort, onReload, tab, iconOnly, isSearching, liveMap, updatedIds, rankMap }: RankTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hideStatus = false;
  const emptyTab = isSearching ? 'rank' : tab;
  const emptyIcon = EMPTY_ICONS[emptyTab];

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);

  // Volta para pág 1 quando os entries mudam (tab ou busca)
  useEffect(() => { setPage(1); }, [entries, pageSize]);

  const totalPages   = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(entries.length / pageSize));
  // Trava a página dentro do intervalo válido mesmo num frame antes do efeito
  // de reset acima rodar (ex: troca de aba/busca com uma lista menor) — sem
  // isso a tabela podia renderizar vazia por um instante.
  const safePage      = Math.min(page, totalPages);
  const numPageSize  = pageSize === 'all' ? entries.length : pageSize;
  const start        = entries.length === 0 ? 0 : (safePage - 1) * numPageSize + 1;
  const end          = Math.min(safePage * numPageSize, entries.length);
  const visibleEntries = pageSize === 'all'
    ? entries
    : entries.slice((safePage - 1) * numPageSize, safePage * numPageSize);

  // Pré-computa ranks: na busca global usa o rank real (por score) de cada entry;
  // nas abas normais usa contagem sequencial (entries já estão na ordem correta).
  const displayRanks: number[] = (() => {
    if (isSearching && rankMap) {
      return entries.map(e => (e.id != null ? (rankMap.get(e.id) ?? 0) : 0));
    }
    let counter = 0;
    return entries.map(e => (e.is_test_mod ? 0 : ++counter));
  })();
  const pageOffset = (safePage - 1) * numPageSize;

  function handlePlayerClick(playerId: number) {
    navigate(`/player/${playerId}`);
  }

  return (
    <div className="container table-section">
      <div className="sort-bar">
        <span className="sort-label">{t('rank.sort.label')}</span>
        {SORT_KEYS.map(({ key, labelKey }) => (
          <button key={key}
            className={`sort-btn${sortKey === key ? ' active' : ''}`}
            onClick={() => onSort(key)}
            aria-pressed={sortKey === key}>
            {t(labelKey)}
          </button>
        ))}
        <div className="sort-bar-actions">
          <div className="page-size-sep" aria-hidden="true" />
          <span className="sort-label">{t('rank.display.label')}</span>
          {PAGE_SIZES.map(({ value, labelKey }) => (
            <button key={String(value)}
              className={`sort-btn${pageSize === value ? ' active' : ''}`}
              onClick={() => setPageSize(value)}
              aria-pressed={pageSize === value}>
              {labelKey ? t(labelKey) : value}
            </button>
          ))}
          <div className="page-size-sep" aria-hidden="true" />
          <button className="btn-reload" onClick={onReload} disabled={loading} aria-label={t('rank.reload_aria')}>
            <i className={`ti ti-refresh${loading ? ' spin' : ''}`} />
          </button>
        </div>
      </div>

      {entries.length === 0 && !loading ? (
        <div className="empty-state">
          <i className={`ti ${emptyIcon}`} aria-hidden="true" />
          <p>{isSearching
            ? t('rank.empty.search')
            : emptyTab === 'rank'
              ? <>{t('rank.empty.rank_1')}<br />{t('rank.empty.rank_2')}</>
              : t(`rank.empty.${emptyTab}`)
          }</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className={`table-wrapper rank-table-desktop${loading ? ' table-loading' : ''}`}>
            <table className="rank-table" aria-label={t('rank.table_aria')}>
              <thead>
                <tr>
                  <th>#</th>
                  <th className="rank-live-th" title={t('rank.live_th')}><i className="ti ti-broadcast" aria-hidden="true" /><span className="sr-only">{t('rank.live_th')}</span></th>
                  <th>{t('rank.th.player')}</th>
                  {!hideStatus && <th>{t('rank.th.status')}</th>}
                  <th>{t('rank.th.score')}</th>
                  <th>{t('rank.th.days')}</th>
                  <th>{t('rank.th.kills')}</th>
                  <th>{t('rank.th.skills')}</th>
                  <th>{t('rank.th.updated')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry, i) => (
                  <RankRow
                    key={entry.id}
                    entry={entry}
                    rank={displayRanks[pageOffset + i]}
                    hideStatus={hideStatus}
                    iconOnly={iconOnly}
                    live={entry.player_id != null ? liveMap?.get(entry.player_id) : undefined}
                    onPlayerClick={handlePlayerClick}
                    isUpdated={entry.player_id != null && updatedIds?.has(entry.player_id)}
                    showDivision={tab === 'rank' && !isSearching}
                  />
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            {entries.length > 0 && pageSize !== 'all' && (
              <div className="rank-pagination">
                <span className="rank-pagination-info">
                  {entries.length === 0 ? t('rank.pagination.zero_results') : t('rank.pagination.range', { start, end, total: entries.length })}
                </span>
                {totalPages > 1 && (
                  <div className="rank-pagination-controls">
                    <button
                      className="pag-btn"
                      disabled={safePage === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      aria-label={t('rank.pagination.prev_aria')}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                    <div className="pag-pages">
                      {buildPageList(safePage, totalPages).map((p, i) =>
                        p === '…'
                          ? <span key={`e${i}`} className="pag-ellipsis">…</span>
                          : <button
                              key={p}
                              className={`pag-page-btn${safePage === p ? ' active' : ''}`}
                              onClick={() => setPage(p as number)}
                              aria-current={safePage === p ? 'page' : undefined}
                            >{p}</button>
                      )}
                    </div>
                    <button
                      className="pag-btn"
                      disabled={safePage === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      aria-label={t('rank.pagination.next_aria')}
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
            {visibleEntries.map((entry, i) => (
              <RankCard
                key={entry.id}
                entry={entry}
                rank={displayRanks[pageOffset + i]}
                onPlayerClick={handlePlayerClick}
                hideStatus={hideStatus}
                live={entry.player_id != null ? liveMap?.get(entry.player_id) : undefined}
                isUpdated={entry.player_id != null && updatedIds?.has(entry.player_id)}
              />
            ))}
            {entries.length > 0 && pageSize !== 'all' && (
              <div className="rank-pagination">
                <span className="rank-pagination-info">{t('rank.pagination.range', { start, end, total: entries.length })}</span>
                {totalPages > 1 && (
                  <div className="rank-pagination-controls">
                    <button className="pag-btn" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                      <i className="ti ti-chevron-left" />
                    </button>
                    <span className="rank-pagination-info">{t('rank.pagination.page_of', { page: safePage, total: totalPages })}</span>
                    <button className="pag-btn" disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
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