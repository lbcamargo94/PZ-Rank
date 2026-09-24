import type { ChampionshipStats } from '../../lib/api';
import { fmtInt } from '../../lib/statsFormat';
import { SectionHeader, StatCard } from './StatsUi';

export function OverviewSection({ data }: { data: ChampionshipStats['overview'] }) {
  return (
    <section className="stats-section">
      <SectionHeader id="visao-geral" icon="📊" title="Visão geral" />
      <div className="stats-cards">
        <StatCard icon="👥" label="Jogadores participantes" value={fmtInt(data.players)} hint="Contas distintas com ao menos uma run" />
        <StatCard icon="🎮" label="Runs registradas"       value={fmtInt(data.runs)}
          hint={data.previous_runs > 0
            ? `Inclui ${fmtInt(data.previous_runs)} runs anteriores de personagens que recomeçaram com o mesmo nome`
            : 'Personagens enviados ao rank'} />
        <StatCard icon="❤️" label="Sobreviventes vivos"    value={fmtInt(data.alive)} />
        <StatCard icon="💀" label="Personagens mortos"     value={fmtInt(data.dead)} />
        <StatCard icon="🧟" label="Zumbis eliminados"      value={fmtInt(data.total_kills)} />
        <StatCard icon="⏱️" label="Dias sobrevividos"      value={fmtInt(data.total_days)}  hint="Soma dos dias de todas as runs" />
        <StatCard icon="🏠" label="Bases Spiffo concluídas" value={fmtInt(data.bases_built)} hint="Bases oficiais validadas pela moderação" />
        <StatCard icon="🧠" label="Habilidades no nível 10" value={fmtInt(data.skills_maxed)} hint="Soma de skills no nível máximo em todas as runs" />
        {/* Ações: só aparecem quando já há runs com dados enviados pelo Companion atualizado */}
        {data.action_runs > 0 && (
          <>
            <StatCard icon="🛠️" label="Itens fabricados"     value={fmtInt(data.items_crafted)} hint={`Em ${fmtInt(data.action_runs)} runs com dados de ações`} />
            <StatCard icon="🍳" label="Refeições preparadas" value={fmtInt(data.meals_cooked)}  hint={`Em ${fmtInt(data.action_runs)} runs com dados de ações`} />
            <StatCard icon="🏚️" label="Casas saqueadas"      value={fmtInt(data.houses_looted)} hint={`Em ${fmtInt(data.action_runs)} runs com dados de ações`} />
          </>
        )}
      </div>
    </section>
  );
}
