interface ProgressBarProps {
  value:      number;
  max:        number;
  label?:     string;
  showValues?: boolean;
  className?: string;
  color?:     string; // CSS color for neon glow (defaults to --green)
}

export function ProgressBar({ value, max, label, showValues = true, className = '', color }: ProgressBarProps) {
  const pct  = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const done = value >= max && max > 0;
  const pctStr = pct.toFixed(pct < 1 ? 1 : 0) + '%';

  const hasHeader = label || showValues;

  return (
    <div className={`pbar-wrap ${className}`.trim()}>
      {hasHeader && (
        <div className="pbar-header">
          {label && <span className="pbar-label">{label}</span>}
          {showValues && (
            <span className={`pbar-vals${done ? ' pbar-done' : ''}`}>
              {value.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')}
            </span>
          )}
          {showValues && (
            <span className={`pbar-pct${done ? ' pbar-done' : ''}`}>{pctStr}</span>
          )}
        </div>
      )}
      <div className="pbar-track">
        <div
          className={`pbar-fill${done ? ' pbar-fill-done' : ''}`}
          style={{
            width: `${pct}%`,
            ...(color ? { '--pbar-color': color } as React.CSSProperties : {}),
          }}
        />
      </div>
    </div>
  );
}
