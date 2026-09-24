import { Link } from 'react-router-dom';
import type { ChampionshipStats } from '../../lib/api';
import { fmtDays, fmtInt } from '../../lib/statsFormat';
import { EmptyState, RankingButton, SectionHeader, type RankingTarget } from './StatsUi';

// Metadados de exibição por métrica — as métricas em si vêm do backend
// (RANKING_METRICS em backend/src/lib/statistics.ts)
export const RECORD_META: Record<string, { icon: string; title: string; unit: string; format: (v: number) => string }> = {
  kills:        { icon: '🧟', title: 'Mais zumbis eliminados',        unit: 'Kills',       format: fmtInt },
  days:         { icon: '⏱️', title: 'Maior sobrevivência',           unit: 'Dias',        format: fmtDays },
  score:        { icon: '⭐', title: 'Maior pontuação',               unit: 'Pontos',      format: v => `${fmtInt(v)} pts` },
  skills10:     { icon: '🔟', title: 'Mais habilidades no nível 10',  unit: 'Skills',      format: fmtInt },
  skill_levels: { icon: '🧠', title: 'Maior soma de níveis de skill', unit: 'Níveis',      format: fmtInt },
  bases:        { icon: '🏠', title: 'Mais bases Spiffo concluídas',  unit: 'Bases',       format: fmtInt },
};

export function recordTarget(metric: string): RankingTarget {
  const m = RECORD_META[metric];
  return { metric, title: m?.title ?? metric, unit: m?.unit ?? '', format: m?.format };
}

export function RecordsSection({ data, onRanking }: { data: ChampionshipStats['records']; onRanking: (metric: string) => void }) {
  return (
    <section className="stats-section">
      <SectionHeader
        id="recordes" icon="🏆" title="Recordes do campeonato"
        sub="Maiores valores estatísticos entre as runs filtradas. Não são conquistas — só números."
      />
      {data.length === 0 ? <EmptyState text="Nenhum recorde para os filtros escolhidos." /> : (
        <div className="stats-records">
          {data.map(({ metric, holder }) => {
            const meta = RECORD_META[metric];
            if (!meta) return null;
            const who = holder.character_name ?? holder.name;
            return (
              <div key={metric} className="stats-record">
                <span className="stats-record-icon" aria-hidden="true">{meta.icon}</span>
                <span className="stats-record-title">{meta.title}</span>
                <span className="stats-record-value">{meta.format(holder.value)}</span>
                <span className="stats-record-who">
                  {holder.player_id ? <Link to={`/player/${holder.player_id}`}>{who}</Link> : who}
                  {holder.character_name && holder.character_name !== holder.name && <small> · {holder.name}</small>}
                </span>
                <RankingButton onClick={() => onRanking(metric)} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
