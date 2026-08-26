import { useState, useEffect, useRef } from 'react';
import { apiGetEntries } from '../lib/api';
import type { Entry } from '../types';

const REFRESH_MS = 15_000;
const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface Row {
  entry:   Entry;
  rank:    number;
  changed: boolean; // pisca brevemente quando o score mudou desde o último poll
}

export function OverlayTop10Page() {
  const [rows,  setRows]  = useState<Row[]>([]);
  const [error, setError] = useState(false);
  const prevScores = useRef<Map<number, number>>(new Map());

  async function load() {
    try {
      const all = await apiGetEntries('score');
      const top10 = all
        .filter(e => e.sandbox_ok !== false && e.is_alive)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const nextRows: Row[] = top10.map((entry, i) => {
        const prevScore = entry.id != null ? prevScores.current.get(entry.id) : undefined;
        return {
          entry,
          rank:    i + 1,
          changed: entry.id != null && prevScore !== undefined && prevScore !== entry.score,
        };
      });

      prevScores.current = new Map(
        top10.filter(e => e.id != null).map(e => [e.id!, e.score])
      );

      setRows(nextRows);
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Some o destaque de "mudou" depois de um instante, sem esperar o próximo poll
  useEffect(() => {
    if (!rows.some(r => r.changed)) return;
    const t = setTimeout(() => {
      setRows(prev => prev.map(r => ({ ...r, changed: false })));
    }, 2500);
    return () => clearTimeout(t);
  }, [rows]);

  if (error || rows.length === 0) {
    return (
      <div className="ovtop-root ovtop-empty">
        {error ? 'DADOS INDISPONÍVEIS' : 'CARREGANDO...'}
      </div>
    );
  }

  return (
    <div className="ovtop-root">
      <div className="ovtop-header">
        <i className="ti ti-trophy" /> Top 10 — Brasileirão PZ
      </div>
      <div className="ovtop-list">
        {rows.map(({ entry, rank, changed }) => (
          <div key={entry.id} className={`ovtop-row${changed ? ' ovtop-row-changed' : ''}`}>
            <span className="ovtop-rank">{MEDALS[rank] ?? `#${rank}`}</span>
            <span className="ovtop-name">
              {entry.character_name || entry.name}
              <small className="ovtop-player">{entry.name}</small>
            </span>
            <span className="ovtop-score">{entry.score.toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
