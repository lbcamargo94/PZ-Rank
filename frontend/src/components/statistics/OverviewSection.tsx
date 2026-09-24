import type { ChampionshipStats } from '../../lib/api';
import { fmtInt } from '../../lib/statsFormat';
import { SectionHeader, StatCard } from './StatsUi';

export function OverviewSection({ data }: { data: ChampionshipStats['overview'] }) {
  return (
    <section className="stats-section">
      <SectionHeader id="visao-geral" icon="📊" title="Visão geral" />
      <div className="stats-cards">
        <StatCard icon="👥" label="Jogadores participantes" value={fmtInt(data.players)} hint="Contas distintas com ao menos uma run" />
        <StatCard icon="🎮" label="Runs registradas"       value={fmtInt(data.runs)}    hint="Personagens enviados ao rank" />
        <StatCard icon="❤️" label="Sobreviventes vivos"    value={fmtInt(data.alive)} />
        <StatCard icon="💀" label="Personagens mortos"     value={fmtInt(data.dead)} />
        <StatCard icon="🧟" label="Zumbis eliminados"      value={fmtInt(data.total_kills)} />
        <StatCard icon="⏱️" label="Dias sobrevividos"      value={fmtInt(data.total_days)}  hint="Soma dos dias de todas as runs" />
        <StatCard icon="🏠" label="Bases Spiffo concluídas" value={fmtInt(data.bases_built)} hint="Bases oficiais validadas pela moderação" />
        <StatCard icon="🧠" label="Habilidades no nível 10" value={fmtInt(data.skills_maxed)} hint="Soma de skills no nível máximo em todas as runs" />
      </div>
    </section>
  );
}
