import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetEntries } from '../lib/api';
import type { Entry } from '../types';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Top10Row({ entry, rank, onClick }: { entry: Entry; rank: number; onClick?: () => void }) {
  const clickable = !!onClick;
  return (
    <div
      className={`top10-row${clickable ? ' top10-row-clickable' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!(); } } : undefined}
    >
      <span className="top10-pos">{MEDALS[rank] ?? `#${rank}`}</span>
      <span className="top10-name">{entry.character_name || entry.name}</span>
      <span className="top10-score">{entry.score.toLocaleString('pt-BR')}</span>
    </div>
  );
}

export function RankTop10Preview() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetEntries('score')
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top10 = useMemo(() => {
    return entries
      .filter(e => e.is_alive && e.sandbox_ok !== false)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [entries]);

  return (
    <section className="home-side-panel rank-top10-preview">
      <h2 className="home-side-panel-title"><i className="ti ti-trophy" /> Top 10 do Rank</h2>
      {loading ? (
        <div className="home-side-panel-loading"><i className="ti ti-loader-2 spin" /></div>
      ) : top10.length === 0 ? (
        <p className="home-side-panel-empty">Nenhum sobrevivente ativo no momento.</p>
      ) : (
        <div className="top10-list">
          {top10.map((entry, i) => (
            <Top10Row
              key={entry.id}
              entry={entry}
              rank={i + 1}
              onClick={entry.player_id != null ? () => navigate(`/player/${entry.player_id}`) : undefined}
            />
          ))}
        </div>
      )}
      <button className="btn-secondary btn-sm home-side-panel-cta" onClick={() => navigate('/rank')}>
        Ver ranking completo <i className="ti ti-arrow-right" />
      </button>
    </section>
  );
}
