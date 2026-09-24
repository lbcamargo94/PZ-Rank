// Blocos visuais reutilizados pelas seções de /estatisticas.
// Gráficos são barras em CSS puro (sem biblioteca de gráficos): o site não tinha
// nenhuma e barras/histogramas não justificam ~100KB de dependência.
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { apiGetChampionshipRanking, type StatsQuery, type StatsRankingRow, type StatsHolder } from '../../lib/api';
import { fmtInt } from '../../lib/statsFormat';

export function SectionHeader({ id, icon, title, sub }: { id: string; icon: string; title: string; sub?: string }) {
  return (
    <header className="stats-section-header" id={id}>
      <h2 className="stats-section-title"><span aria-hidden="true">{icon}</span> {title}</h2>
      {sub && <p className="stats-section-sub">{sub}</p>}
    </header>
  );
}

export function StatCard({ icon, label, value, hint }: { icon: string; label: string; value: string; hint?: string }) {
  return (
    <div className="stats-card" data-tip={hint}>
      <span className="stats-card-icon" aria-hidden="true">{icon}</span>
      <span className="stats-card-value">{value}</span>
      <span className="stats-card-label">{label}</span>
    </div>
  );
}

export interface BarItem {
  key:    string;
  label:  ReactNode;
  value:  number;     // define o tamanho da barra
  display: string;    // texto à direita da barra
  tip:    string;     // tooltip (acessível também via title)
}

/** Lista de barras horizontais. `initial` limita a exibição com botão "ver todos". */
export function BarList({ items, initial, empty }: { items: BarItem[]; initial?: number; empty?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return <EmptyState text={empty ?? 'Nenhum dado para os filtros escolhidos.'} />;
  const max = Math.max(...items.map(i => i.value), 0) || 1;
  const shown = initial && !expanded ? items.slice(0, initial) : items;

  return (
    <div className="stats-bars">
      <ul className="stats-bar-list">
        {shown.map(item => (
          <li key={item.key} className="stats-bar-row" data-tip={item.tip} title={item.tip}>
            <span className="stats-bar-label">{item.label}</span>
            <span className="stats-bar-track" aria-hidden="true">
              <span className="stats-bar-fill" style={{ width: `${Math.max(1, (item.value / max) * 100)}%` }} />
            </span>
            <span className="stats-bar-value">{item.display}</span>
          </li>
        ))}
      </ul>
      {initial && items.length > initial && (
        <button type="button" className="stats-link-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Mostrar menos' : `Ver todos (${items.length})`}
        </button>
      )}
    </div>
  );
}

/** Histograma vertical. Cada coluna = uma faixa; altura proporcional à contagem. */
export function Histogram({ columns }: { columns: Array<{ label: string; count: number; tip: string }> }) {
  const max = Math.max(...columns.map(c => c.count), 0) || 1;
  const total = columns.reduce((s, c) => s + c.count, 0);
  if (total === 0) return <EmptyState text="Nenhum dado para os filtros escolhidos." />;
  return (
    <div className="stats-histogram" role="img" aria-label={columns.map(c => `${c.label}: ${c.count}`).join(', ')}>
      {columns.map(c => (
        <div key={c.label} className="stats-hist-col" data-tip={c.tip} title={c.tip}>
          <span className="stats-hist-count">{fmtInt(c.count)}</span>
          <span className="stats-hist-bar-wrap">
            <span className="stats-hist-bar" style={{ height: `${(c.count / max) * 100}%` }} />
          </span>
          <span className="stats-hist-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="stats-empty"><i className="ti ti-database-off" aria-hidden="true" /> {text}</p>;
}

export function HolderLine({ holder, format }: { holder: StatsHolder | null; format: (v: number) => string }) {
  if (!holder) return null;
  const who = holder.character_name ? `${holder.character_name} (${holder.name})` : holder.name;
  return (
    <p className="stats-holder">
      <i className="ti ti-crown" aria-hidden="true" /> Recorde: <strong>{format(holder.value)}</strong> —{' '}
      {holder.player_id ? <Link to={`/player/${holder.player_id}`}>{who}</Link> : who}
    </p>
  );
}

// ── Ranking por estatística (modal) ────────────────────────────────────────

export interface RankingTarget { metric: string; title: string; unit: string; format?: (v: number) => string }

export function RankingModal({ target, query, onClose }: { target: RankingTarget; query: StatsQuery; onClose: () => void }) {
  const [rows, setRows]   = useState<StatsRankingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const format = target.format ?? fmtInt;

  useEffect(() => {
    let alive = true;
    setRows(null); setError(null);
    apiGetChampionshipRanking(target.metric, query, 50)
      .then(r => { if (alive) setRows(r); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Erro ao carregar ranking.'); });
    return () => { alive = false; };
  }, [target.metric, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-bg open" onClick={onClose}>
      <div className="modal stats-ranking-modal" role="dialog" aria-modal="true" aria-label={target.title} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title"><i className="ti ti-list-numbers" aria-hidden="true" /> {target.title}</h3>
          <button type="button" className="stats-icon-btn" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">
        {error && <p className="stats-error"><i className="ti ti-alert-circle" /> {error}</p>}
        {!error && !rows && <p className="stats-loading"><i className="ti ti-loader-2 spin" /> Carregando ranking...</p>}
        {rows && rows.length === 0 && <EmptyState text="Ninguém pontuou nesta estatística ainda." />}
        {rows && rows.length > 0 && (
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead><tr><th>#</th><th>Jogador</th><th className="num">{target.unit}</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={`${r.position}-${r.player_id}-${r.character_name}`}>
                    <td className="num">{r.position}</td>
                    <td>
                      {r.player_id ? <Link to={`/player/${r.player_id}`} onClick={onClose}>{r.name}</Link> : r.name}
                      {r.character_name && <span className="stats-sub-name">{r.character_name}{!r.is_alive && ' 💀'}</span>}
                    </td>
                    <td className="num">{format(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export function RankingButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="stats-link-btn" onClick={onClick}>
      <i className="ti ti-list-numbers" aria-hidden="true" /> Ver ranking
    </button>
  );
}
