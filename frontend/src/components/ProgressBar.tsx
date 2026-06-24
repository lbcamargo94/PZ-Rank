import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  value:       number;
  max:         number;
  label?:      string;
  showValues?: boolean;
  className?:  string;
}

export function ProgressBar({ value, max, label, showValues = true, className = '' }: ProgressBarProps) {
  const pct  = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const done = value >= max && max > 0;

  return (
    <div className={`pbar-wrap ${className}`.trim()}>
      {label && (
        <div className="pbar-header">
          <span className="pbar-label">{label}</span>
          {showValues && (
            <span className={`pbar-vals${done ? ' pbar-done' : ''}`}>
              {value.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      )}
      <Progress value={pct} className={done ? 'progress-done' : ''} />
    </div>
  );
}