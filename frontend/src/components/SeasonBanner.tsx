import { useEffect, useState } from 'react';
import { apiGetActiveSeason, apiGetGlobalStats } from '../lib/api';
import type { Season } from '../types';
import type { GlobalStats } from '../lib/api';

function daysSince(dateStr: string): number {
  const start = new Date(dateStr).getTime();
  return Math.floor((Date.now() - start) / 86_400_000);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' mi';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.', ',') + ' mil';
  return n.toLocaleString('pt-BR');
}

export function SeasonBanner() {
  const [season, setSeason] = useState<Season | null>(null);
  const [stats,  setStats]  = useState<GlobalStats | null>(null);

  useEffect(() => {
    Promise.all([apiGetActiveSeason(), apiGetGlobalStats()])
      .then(([s, g]) => { setSeason(s); setStats(g); })
      .catch(() => {});
  }, []);

  if (!season) return null;

  const days        = daysSince(season.started_at);
  const startedFmt  = new Date(season.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="season-banner">
      <div className="container">
        <div className="sb-inner">
          <div className="sb-title-wrap">
            <span className="sb-badge">ATIVA</span>
            <h2 className="sb-name">{season.name}</h2>
            <span className="sb-started">Iniciada em {startedFmt}</span>
          </div>

          <div className="sb-stats">
            <div className="sb-stat">
              <span className="sb-stat-value">{days === 0 ? 'Hoje' : `${days}d`}</span>
              <span className="sb-stat-label">de campeonato</span>
            </div>
            {stats && (
              <>
                <div className="sb-divider" />
                <div className="sb-stat">
                  <span className="sb-stat-value">{fmt(stats.player_count)}</span>
                  <span className="sb-stat-label">jogadores</span>
                </div>
                <div className="sb-divider" />
                <div className="sb-stat sb-stat--alive">
                  <span className="sb-stat-value">{fmt(stats.alive_count)}</span>
                  <span className="sb-stat-label">vivos</span>
                </div>
                <div className="sb-divider" />
                <div className="sb-stat sb-stat--dead">
                  <span className="sb-stat-value">{fmt(stats.dead_count)}</span>
                  <span className="sb-stat-label">mortos</span>
                </div>
                <div className="sb-divider" />
                <div className="sb-stat sb-stat--kills">
                  <span className="sb-stat-value">{fmt(stats.total_kills)}</span>
                  <span className="sb-stat-label">zumbis</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
