import type { ChampionshipStats } from '../../lib/api';
import { fmtDec, fmtInt, fmtPct, fmtRange } from '../../lib/statsFormat';
import { HolderLine, Histogram, RankingButton, SectionHeader, StatCard } from './StatsUi';

export function ZombieSection({ data, onRanking }: { data: ChampionshipStats['zombies']; onRanking: () => void }) {
  const total = data.buckets.reduce((s, b) => s + b.count, 0);
  return (
    <section className="stats-section">
      <SectionHeader id="zumbis" icon="🧟" title="Extermínio" />
      <div className="stats-cards stats-cards--compact">
        <StatCard icon="🧟" label="Zumbis mortos"          value={fmtInt(data.total)} />
        <StatCard icon="👤" label="Média por jogador"      value={fmtInt(data.avg_per_player)} hint="Soma das runs de cada conta" />
        <StatCard icon="🎮" label="Média por run"          value={fmtInt(data.avg_per_run)} />
        <StatCard icon="⚖️" label="Mediana por run"        value={fmtInt(data.median_per_run)} hint="Metade das runs matou até este valor" />
        <StatCard icon="📅" label="Média por dia sobrevivido" value={fmtDec(data.per_day)} />
        <StatCard icon="💀" label="Média de kills antes da morte" value={fmtInt(data.avg_before_death)} hint="Só runs já encerradas" />
      </div>
      <h3 className="stats-subtitle">Distribuição de runs por zumbis mortos</h3>
      <Histogram columns={data.buckets.map(b => ({
        label: fmtRange(b.min, b.max),
        count: b.count,
        tip:   `${fmtRange(b.min, b.max, 'kills')}: ${fmtInt(b.count)} runs (${fmtPct(total ? (b.count / total) * 100 : 0)})`,
      }))} />
      <div className="stats-section-foot">
        <HolderLine holder={data.top} format={v => `${fmtInt(v)} kills`} />
        <RankingButton onClick={onRanking} />
      </div>
    </section>
  );
}
