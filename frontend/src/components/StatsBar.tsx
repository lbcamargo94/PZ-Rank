interface StatsBarProps {
  alive:        number;
  dead:         number;
  disqualified: number;
}

export function StatsBar({ alive, dead, disqualified }: StatsBarProps) {
  return (
    <div className="container stats-bar">
      <div className="stat-card stat-alive">
        <span className="stat-label"><i className="ti ti-heartbeat" aria-hidden="true" /> Vivos</span>
        <span className="stat-value">{alive}</span>
      </div>
      <div className="stat-card stat-dead">
        <span className="stat-label"><i className="ti ti-skull" aria-hidden="true" /> Eliminados</span>
        <span className="stat-value">{dead}</span>
      </div>
      <div className="stat-card stat-disc">
        <span className="stat-label"><i className="ti ti-ban" aria-hidden="true" /> Desclassificados</span>
        <span className="stat-value">{disqualified}</span>
      </div>
    </div>
  );
}
