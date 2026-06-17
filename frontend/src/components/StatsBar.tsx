interface StatsBarProps {
  total: number;
  maxDays: number;
  maxKills: number;
}

export function StatsBar({ total, maxDays, maxKills }: StatsBarProps) {
  return (
    <div className="container stats-bar">
      <div className="stat-card">
        <span className="stat-label">Total de sobreviventes</span>
        <span className="stat-value">{total}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Maior sobrevivência</span>
        <span className="stat-value">{maxDays} dias</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Maior massacre</span>
        <span className="stat-value">{maxKills} zumbis</span>
      </div>
    </div>
  );
}
