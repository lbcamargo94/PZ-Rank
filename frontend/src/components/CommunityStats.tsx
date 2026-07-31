import { useEffect, useState } from 'react';
import { apiGetGlobalStats, apiGetActiveSeason, type GlobalStats } from '../lib/api';
import type { Season } from '../types';

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' mi';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.', ',') + ' mil';
  return n.toLocaleString('pt-BR');
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function CommunityStats() {
  const [stats,  setStats]  = useState<GlobalStats | null>(null);
  const [season, setSeason] = useState<Season | null>(null);

  useEffect(() => {
    Promise.all([apiGetGlobalStats(), apiGetActiveSeason()])
      .then(([g, s]) => { setStats(g); setSeason(s); })
      .catch(() => {});
  }, []);

  if (!stats && !season) return null;

  const days       = season ? daysSince(season.started_at) : 0;
  const startedFmt = season
    ? new Date(season.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="community-stats">
      {season && (
        <div className="cs-season-header">
          <span className="cs-season-badge">ATIVA</span>
          <span className="cs-season-name">{season.name}</span>
          <span className="cs-season-meta">
            Iniciada em {startedFmt}
            {days > 0 && <> · <strong>{days}</strong> {days === 1 ? 'dia' : 'dias'} de campeonato</>}
            {days === 0 && <> · Iniciada hoje</>}
          </span>
        </div>
      )}
      {stats && (
        <div className="cs-grid">
          <div className="cs-item cs-item--kills">
            <i className="ti ti-sword" />
            <span className="cs-value">{fmt(stats.total_kills)}</span>
            <span className="cs-desc">zumbis abatidos</span>
          </div>
          <div className="cs-item cs-item--days">
            <i className="ti ti-calendar-stats" />
            <span className="cs-value">{fmt(stats.total_days)}</span>
            <span className="cs-desc">dias sobrevividos</span>
          </div>
          <div className="cs-item cs-item--alive">
            <i className="ti ti-heartbeat" />
            <span className="cs-value">{fmt(stats.alive_count)}</span>
            <span className="cs-desc">sobreviventes</span>
          </div>
          <div className="cs-item cs-item--dead">
            <i className="ti ti-skull" />
            <span className="cs-value">{fmt(stats.dead_count)}</span>
            <span className="cs-desc">mortos</span>
          </div>
        </div>
      )}
    </div>
  );
}
