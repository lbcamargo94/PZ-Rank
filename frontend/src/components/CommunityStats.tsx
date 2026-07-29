import { useEffect, useState } from 'react';
import { apiGetGlobalStats, type GlobalStats } from '../lib/api';

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' mi';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.', ',') + ' mil';
  return n.toLocaleString('pt-BR');
}

export function CommunityStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    apiGetGlobalStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="community-stats container">
      <div className="cs-header">
        <i className="ti ti-chart-bar cs-header-icon" />
        <span className="cs-title">Temporada 1 — Totais Acumulados</span>
      </div>
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
          <span className="cs-desc">ainda de pé</span>
        </div>
        <div className="cs-item cs-item--dead">
          <i className="ti ti-skull" />
          <span className="cs-value">{fmt(stats.dead_count)}</span>
          <span className="cs-desc">tombaram</span>
        </div>
      </div>
    </div>
  );
}
