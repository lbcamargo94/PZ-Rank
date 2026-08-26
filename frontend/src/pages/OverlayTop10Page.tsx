import { useState, useEffect, useRef } from 'react';
import { apiGetTop10Entries } from '../lib/api';
import { formatNumber } from '../lib/format';
import type { Top10Entry } from '../types';

// Alinhado ao Cache-Control: s-maxage=60 de /entries/top10 — pollar mais
// rápido que isso só gera Edge Requests extras sem nunca pegar dado mais
// fresco (a resposta cacheada na borda da Vercel já é reaproveitada até 60s).
const REFRESH_MS = 60_000;
const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface Row {
  entry:   Top10Entry;
  rank:    number;
  changed: boolean; // pisca brevemente quando o score mudou desde o último poll
}

export function OverlayTop10Page() {
  const [rows,  setRows]  = useState<Row[]>([]);
  const [error, setError] = useState(false);
  const prevScores = useRef<Map<number, number>>(new Map());

  // Fundo transparente pro OBS compositar só o painel, sem o background do
  // site por trás (igual ao restante do overlay, ver overlay-page-active).
  useEffect(() => {
    document.body.classList.add('overlay-page-active');
    return () => document.body.classList.remove('overlay-page-active');
  }, []);

  async function load() {
    try {
      const top10 = await apiGetTop10Entries();

      const nextRows: Row[] = top10.map((entry, i) => {
        const prevScore = prevScores.current.get(entry.id);
        return {
          entry,
          rank:    i + 1,
          changed: prevScore !== undefined && prevScore !== entry.score,
        };
      });

      prevScores.current = new Map(top10.map(e => [e.id, e.score]));

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

  return (
    <div className="ovtop-wrap">
      <section className="home-side-panel rank-top10-preview">
        <h2 className="home-side-panel-title"><i className="ti ti-trophy" /> Top 10 do Rank</h2>
        {rows.length === 0 ? (
          <p className="home-side-panel-empty">{error ? 'Dados indisponíveis.' : 'Carregando...'}</p>
        ) : (
          <div className="top10-list">
            {rows.map(({ entry, rank, changed }) => (
              <div key={entry.id} className={`top10-row${changed ? ' ovtop-row-changed' : ''}`}>
                <span className="top10-pos">{MEDALS[rank] ?? `#${rank}`}</span>
                <span className="top10-name">{entry.character_name || entry.name}</span>
                <span className="top10-score">{formatNumber(entry.score)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="btn-secondary btn-sm home-side-panel-cta">
          Ver ranking completo <i className="ti ti-arrow-right" />
        </div>
      </section>
    </div>
  );
}
