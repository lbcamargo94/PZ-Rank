import { IconHeartbeat, IconSkull, IconBan } from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsBarProps {
  alive:        number;
  dead:         number;
  disqualified: number;
}

export function StatsBar({ alive, dead, disqualified }: StatsBarProps) {
  return (
    <div className="container stats-bar">
      <Card className="stat-alive">
        <CardContent className="flex flex-col gap-1 py-3.5 px-4">
          <span className="stat-label"><IconHeartbeat size={16} aria-hidden="true" /> Vivos</span>
          <span className="stat-value">{alive}</span>
        </CardContent>
      </Card>
      <Card className="stat-dead">
        <CardContent className="flex flex-col gap-1 py-3.5 px-4">
          <span className="stat-label"><IconSkull size={16} aria-hidden="true" /> Eliminados</span>
          <span className="stat-value">{dead}</span>
        </CardContent>
      </Card>
      <Card className="stat-disc">
        <CardContent className="flex flex-col gap-1 py-3.5 px-4">
          <span className="stat-label"><IconBan size={16} aria-hidden="true" /> Desclassificados</span>
          <span className="stat-value">{disqualified}</span>
        </CardContent>
      </Card>
    </div>
  );
}