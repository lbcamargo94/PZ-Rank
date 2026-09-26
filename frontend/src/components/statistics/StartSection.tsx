import type { ChampionshipStats } from '../../lib/api';
import { fmtDays, fmtInt, fmtPct } from '../../lib/statsFormat';
import { BarList, EmptyState, SectionHeader } from './StatsUi';

export function StartSection({ data }: { data: ChampionshipStats['starts'] }) {
  const since = `Registrado para personagens criados a partir do mod ${data.min_mod_version}`;
  return (
    <section className="stats-section">
      <SectionHeader
        id="cidade-inicial" icon="🗺️" title="Onde os jogadores começam"
        sub={data.tracked > 0
          ? `${since}: ${fmtInt(data.tracked)} de ${fmtInt(data.runs_total)} runs já têm a cidade inicial registrada.`
          : undefined}
      />
      {data.tracked === 0 ? (
        <EmptyState text={`${since}. As cidades aparecem aqui conforme novos personagens forem criados.`} />
      ) : (
        <>
          <BarList items={data.regions.map(r => ({
            key:     r.id,
            value:   r.runs,
            display: fmtPct(r.pct),
            tip:     `${r.name} — ${fmtInt(r.runs)} runs (${fmtPct(r.pct)}) · média de ${fmtDays(r.avg_days)} e ${fmtInt(r.avg_kills)} kills`
              + (r.avg_days_dead != null ? ` · quem já morreu durou em média ${fmtDays(r.avg_days_dead)}` : ''),
            label: (
              <>
                <span>{r.name}</span>
                <span className="stats-bar-meta">
                  {fmtInt(r.runs)} {r.runs === 1 ? 'run' : 'runs'} · média {fmtDays(r.avg_days)}
                </span>
              </>
            ),
          }))} />
          <p className="stats-section-sub stats-note">
            Guardamos apenas o nome da cidade onde o personagem nasceu, nunca a posição exata.
            Quem atualizou o mod no meio de uma partida só entra aqui a partir do próximo personagem.
          </p>
        </>
      )}
    </section>
  );
}
