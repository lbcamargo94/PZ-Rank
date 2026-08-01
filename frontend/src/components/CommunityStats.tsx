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

  const days = season ? daysSince(season.started_at) : 0;

  return (
    <div className="community-stats">
      <div className="cs-row">

        {season && (
          <div className="cs-item cs-item--season">
            <i className="ti ti-shield-star" />
            <span className="cs-value cs-season-name">{season.name}</span>
            <span className="cs-desc">
              {days > 0 ? `${days} ${days === 1 ? 'dia' : 'dias'} ativa` : 'ativa hoje'}
            </span>
          </div>
        )}

        {season && stats && <div className="cs-vdivider" />}

        {stats && (
          <>
            <div className="cs-item cs-item--kills">
              <i className="ti ti-sword" />
              <span className="cs-value">{fmt(stats.total_kills)}</span>
              <span className="cs-desc">zumbis</span>
            </div>
            <div className="cs-vdivider" />
            <div className="cs-item cs-item--days">
              <i className="ti ti-calendar-stats" />
              <span className="cs-value">{fmt(stats.total_days)}</span>
              <span className="cs-desc">dias sobrevividos</span>
            </div>
            <div className="cs-vdivider" />
            <div className="cs-item cs-item--alive">
              <i className="ti ti-heartbeat" />
              <span className="cs-value">{fmt(stats.alive_count)}</span>
              <span className="cs-desc">vivos</span>
            </div>
            <div className="cs-vdivider" />
            <div className="cs-item cs-item--dead">
              <i className="ti ti-skull" />
              <span className="cs-value">{fmt(stats.dead_count)}</span>
              <span className="cs-desc">mortos</span>
            </div>
            {stats.active_count > 0 && (
              <>
                <div className="cs-vdivider" />
                <div className="cs-item cs-item--active">
                  <span className="cs-active-dot" aria-hidden="true" />
                  <span className="cs-value">{fmt(stats.active_count)}</span>
                  <span className="cs-desc">jogando hoje</span>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
