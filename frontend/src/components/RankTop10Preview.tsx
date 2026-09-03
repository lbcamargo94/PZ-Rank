import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiGetTop10Entries } from '../lib/api';
import { formatNumber } from '../lib/format';
import { useSse } from '../hooks/useSse';
import type { Top10Entry } from '../types';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Top10Row({ entry, rank, onClick }: { entry: Top10Entry; rank: number; onClick?: () => void }) {
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
      <span className="top10-score">{formatNumber(entry.score)}</span>
    </div>
  );
}

export function RankTop10Preview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [top10,   setTop10]   = useState<Top10Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    apiGetTop10Entries().then(setTop10).catch(() => {});
  }, []);

  useEffect(() => {
    apiGetTop10Entries()
      .then(setTop10)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Atualiza o top10 em tempo real quando um sync altera pontuações.
  useSse({ 'rank-updated': refresh });

  return (
    <section className="home-side-panel rank-top10-preview">
      <h2 className="home-side-panel-title"><i className="ti ti-trophy" /> {t('home.top10.title')}</h2>
      {loading ? (
        <div className="home-side-panel-loading"><i className="ti ti-loader-2 spin" /></div>
      ) : top10.length === 0 ? (
        <p className="home-side-panel-empty">{t('home.top10.empty')}</p>
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
        {t('home.top10.view_full')} <i className="ti ti-arrow-right" />
      </button>
    </section>
  );
}
