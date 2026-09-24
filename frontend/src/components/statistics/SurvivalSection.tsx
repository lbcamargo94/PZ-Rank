import type { ChampionshipStats } from '../../lib/api';
import { fmtDays, fmtInt, fmtPct, fmtRange } from '../../lib/statsFormat';
import { HolderLine, Histogram, RankingButton, SectionHeader, StatCard } from './StatsUi';

export function SurvivalSection({ data, onRanking }: { data: ChampionshipStats['survival']; onRanking: () => void }) {
  const total = data.buckets.reduce((s, b) => s + b.count, 0);
  return (
    <section className="stats-section">
      <SectionHeader
        id="sobrevivencia" icon="⏱️" title="Sobrevivência"
        sub="Dias de jogo por run. Runs vivas ainda estão em andamento — a média delas continua subindo."
      />
      <div className="stats-cards stats-cards--compact">
        <StatCard icon="📈" label="Média"                value={fmtDays(data.avg_days)} />
        <StatCard icon="⚖️" label="Mediana"              value={fmtDays(data.median_days)} hint="Metade das runs durou até este valor" />
        <StatCard icon="🏆" label="Maior sobrevivência"  value={fmtDays(data.max_days)} />
        <StatCard icon="🥀" label="Menor sobrevivência"  value={fmtDays(data.min_days)} />
        <StatCard icon="💀" label="Média dos mortos"     value={fmtDays(data.avg_dead)} />
        <StatCard icon="❤️" label="Média dos vivos"      value={fmtDays(data.avg_alive)} />
      </div>
      <h3 className="stats-subtitle">Distribuição de runs por dias sobrevividos</h3>
      <Histogram columns={data.buckets.map(b => ({
        label: fmtRange(b.min, b.max),
        count: b.count,
        tip:   `${fmtRange(b.min, b.max, 'dias')}: ${fmtInt(b.count)} runs (${fmtPct(total ? (b.count / total) * 100 : 0)})`,
      }))} />
      <div className="stats-section-foot">
        <HolderLine holder={data.longest} format={fmtDays} />
        <RankingButton onClick={onRanking} />
      </div>
    </section>
  );
}
