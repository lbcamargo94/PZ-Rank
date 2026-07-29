import { useEffect, useState } from 'react';
import { apiGetLatestNews } from '../lib/api';
import type { DailyNews, NewsStats } from '../types';

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

function autoHeadline(s: NewsStats): string {
  const parts: string[] = [];
  if (s.deaths_today === 1)    parts.push('1 sobrevivente tombou hoje');
  else if (s.deaths_today > 1) parts.push(`${s.deaths_today} sobreviventes tombaram hoje`);

  const aliveSync = s.new_syncs_today - s.deaths_today;
  if (aliveSync === 1)    parts.push('1 sync registrado');
  else if (aliveSync > 1) parts.push(`${aliveSync} syncs registrados`);

  if (parts.length === 0) {
    return s.alive_count > 0
      ? `${fmt(s.alive_count)} ${s.alive_count === 1 ? 'sobrevivente resiste' : 'sobreviventes resistem'} ao apocalipse.`
      : 'Nenhuma atividade registrada hoje.';
  }
  return parts.join(' · ') + '.';
}

export function NewsCard() {
  const [news,    setNews]    = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetLatestNews()
      .then(setNews)
      .catch(() => { /* silencioso — card some se falhar */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !news) return null;

  const stats    = news.stats;
  const headline = news.headline ?? (stats ? autoHeadline(stats) : null);

  return (
    <div className="container">
      <div className="news-card">
        <div className="news-card-header">
          <span className="news-card-label">
            <i className="ti ti-news" /> JORNAL DO APOCALIPSE
          </span>
          <span className="news-card-date">{fmtDate(news.date)}</span>
        </div>

        {headline && (
          <p className="news-card-headline">{headline}</p>
        )}

        {stats && (
          <div className="news-card-stats">
            <span className="news-stat news-stat--alive">
              <i className="ti ti-heartbeat" /> {fmt(stats.alive_count)} vivos
            </span>
            <span className="news-stat news-stat--dead">
              <i className="ti ti-skull" /> {fmt(stats.dead_count)} mortos
            </span>
            <span className="news-stat news-stat--kills">
              <i className="ti ti-sword" /> {fmt(stats.total_kills)} abatidos
            </span>
            {stats.new_syncs_today > 0 && (
              <span className="news-stat news-stat--sync">
                <i className="ti ti-refresh" /> {stats.new_syncs_today} hoje
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
