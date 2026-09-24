import type { ChampionshipStats } from '../../lib/api';
import { getProfessionImageUrl } from '../../lib/professions';
import { fmtDays, fmtInt, fmtPct } from '../../lib/statsFormat';
import { BarList, SectionHeader } from './StatsUi';

export function ProfessionSection({ data }: { data: ChampionshipStats['professions'] }) {
  const items = data.map(p => {
    const img = getProfessionImageUrl(p.name);
    return {
      key:     p.name,
      value:   p.runs,
      display: fmtPct(p.pct),
      tip:     `${p.name} — ${fmtInt(p.runs)} runs · ${fmtInt(p.players)} jogadores · ${fmtPct(p.pct)} do total · média de ${fmtDays(p.avg_days)} · ${fmtInt(p.avg_kills)} kills em média`,
      label: (
        <>
          {img
            ? <img src={img} alt="" className="stats-bar-img" loading="lazy" />
            : <span className="stats-bar-img" aria-hidden="true" />}
          <span>{p.name}</span>
          <span className="stats-bar-meta">{fmtInt(p.runs)} runs · {fmtInt(p.players)} jog.</span>
        </>
      ),
    };
  });

  return (
    <section className="stats-section">
      <SectionHeader
        id="profissoes" icon="👷" title="Profissões mais escolhidas"
        sub="Contadas por run (personagem). Nomes em outros idiomas do jogo são agrupados na mesma profissão."
      />
      <BarList items={items} initial={10} />
    </section>
  );
}
