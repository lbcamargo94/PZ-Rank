import type { ChampionshipStats } from '../../lib/api';
import { fmtDays, fmtInt } from '../../lib/statsFormat';
import { EmptyState, SectionHeader } from './StatsUi';

type Week = ChampionshipStats['timeline']['weeks'][number];

// "2026-09-21" → "21/09" (data da segunda-feira que abre a semana)
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

interface Series {
  key:   'runs_started' | 'deaths' | 'signups';
  label: string;
  cls:   string;       // classe da cor (tokens em statistics.css)
  tip:   (w: Week) => string;
  noDataTip?: (w: Week) => string;   // semana sem registro (valor null)
}

/** Colunas semanais (1 ou 2 séries lado a lado, mesmo eixo). Barras finas com
 *  ponta arredondada e 2px entre barras; tooltip em cada barra; legenda sempre
 *  presente com 2+ séries; grade discreta com 3 linhas (0, metade, máximo). */
function WeeklyColumns({ weeks, series, ariaLabel }: { weeks: Week[]; series: Series[]; ariaLabel: string }) {
  const max = Math.max(1, ...weeks.flatMap(w => series.map(s => w[s.key] ?? 0)));
  const ticks = [max, Math.round(max / 2), 0];
  const last = weeks[weeks.length - 1];
  return (
    <figure className="stats-tl">
      {series.length > 1 && (
        <figcaption className="stats-tl-legend">
          {series.map(s => (
            <span key={s.key} className="stats-tl-legend-item">
              <span className={`stats-tl-swatch ${s.cls}`} aria-hidden="true" />
              {s.label}
              {last && last[s.key] != null && <strong className="stats-tl-legend-last">{fmtInt(last[s.key]!)} nesta semana</strong>}
            </span>
          ))}
        </figcaption>
      )}
      <div className="stats-tl-plot" role="img" aria-label={ariaLabel}>
        <div className="stats-tl-axis" aria-hidden="true">
          {/* mesma posição das linhas de grade (top %), centralizado nela */}
          {ticks.map((t, i) => (
            <span key={i} style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>{fmtInt(t)}</span>
          ))}
        </div>
        <div className="stats-tl-grid">
          <div className="stats-tl-lines" aria-hidden="true">
            {ticks.map((_, i) => <span key={i} className="stats-tl-gridline" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }} />)}
          </div>
          {weeks.map((w, wi) => {
            // balão do tooltip alinhado pela posição: nas pontas ele não pode passar
            // da borda da tela (o pseudo-elemento, mesmo invisível, alarga a página)
            const align = wi < weeks.length / 3 ? 'left' : wi >= (weeks.length * 2) / 3 ? 'right' : undefined;
            return (
            <div key={w.week_start} className="stats-tl-week">
              <div className="stats-tl-bars">
                {series.map(s => {
                  const v = w[s.key];
                  if (v == null) {
                    // sem registro: contorno tracejado (não é zero)
                    const tip = s.noDataTip?.(w) ?? 'Sem dado nesta semana';
                    return <span key={s.key} className="stats-tl-bar stats-tl-bar--nodata" data-tip={tip} data-tip-align={align} title={tip} />;
                  }
                  return (
                    <span
                      key={s.key}
                      className={`stats-tl-bar ${s.cls}`}
                      style={{ height: `${(v / max) * 100}%` }}
                      data-tip={s.tip(w)}
                      data-tip-align={align}
                      title={s.tip(w)}
                    />
                  );
                })}
              </div>
              <span className="stats-tl-label">{shortDate(w.week_start)}</span>
            </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}

export function TimelineSection({ data }: { data: ChampionshipStats['timeline'] }) {
  const weeks = data.weeks;
  const deathsSince   = shortDate(data.deaths_tracked_since);
  const restartsSince = shortDate(data.restarts_tracked_since);
  const hasNoDeathData = weeks.some(w => w.deaths == null);
  const runsDeaths: Series[] = [
    { key: 'runs_started', label: 'Runs iniciadas', cls: 'is-s1',
      tip: w => `Semana de ${shortDate(w.week_start)} — ${fmtInt(w.runs_started)} runs iniciadas` },
    { key: 'deaths', label: 'Mortes', cls: 'is-s2',
      tip: w => `Semana de ${shortDate(w.week_start)} — ${fmtInt(w.deaths ?? 0)} mortes` +
        ((w.deaths ?? 0) > 0 ? ` · sobreviveram em média ${fmtDays(w.avg_days_at_death ?? 0)}` : ''),
      noDataTip: w => `Semana de ${shortDate(w.week_start)} — mortes sem registro completo (o site registra a data das mortes desde ${deathsSince})` },
  ];
  const signups: Series[] = [
    { key: 'signups', label: 'Novos inscritos', cls: 'is-s0',
      tip: w => `Semana de ${shortDate(w.week_start)} — ${fmtInt(w.signups)} novos inscritos` },
  ];

  return (
    <section className="stats-section">
      <SectionHeader
        id="evolucao" icon="📈" title="Evolução da temporada"
        sub="Semanas de segunda a domingo (horário de Brasília). Passe o mouse ou toque nas barras para ver os números."
      />
      {weeks.length === 0 ? <EmptyState text="Ainda não há semanas com dados para os filtros escolhidos." /> : (
        <>
          <h3 className="stats-subtitle">Runs iniciadas e mortes por semana</h3>
          <WeeklyColumns weeks={weeks} series={runsDeaths} ariaLabel="Runs iniciadas e mortes por semana" />

          <h3 className="stats-subtitle">Novos inscritos por semana</h3>
          <WeeklyColumns weeks={weeks} series={signups} ariaLabel="Novos inscritos por semana" />

          <details className="stats-howto">
            <summary><i className="ti ti-table" aria-hidden="true" /> Ver os números em tabela</summary>
            <div className="stats-table-wrap">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Semana de</th>
                    <th className="num">Runs iniciadas</th>
                    <th className="num">Mortes</th>
                    <th className="num">Média de dias das mortes</th>
                    <th className="num">Novos inscritos</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map(w => (
                    <tr key={w.week_start}>
                      <td>{shortDate(w.week_start)}</td>
                      <td className="num">{fmtInt(w.runs_started)}</td>
                      <td className="num">{w.deaths == null ? '—' : fmtInt(w.deaths)}</td>
                      <td className="num">{w.deaths ? fmtDays(w.avg_days_at_death ?? 0) : '—'}</td>
                      <td className="num">{fmtInt(w.signups)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <ul className="stats-section-sub stats-note stats-tl-notes">
            {hasNoDeathData && (
              <li>As mortes têm data registrada desde a semana de {deathsSince}. Nas semanas anteriores a barra aparece tracejada: não há registro completo (não é zero).</li>
            )}
            <li>Até a semana de {restartsSince}, uma partida recomeçada com o mesmo nome de personagem não era guardada — nas semanas anteriores, “runs iniciadas” conta só a primeira partida de cada personagem.</li>
            <li>Partidas encerradas com 0 dias e 0 zumbis mortos não contam.</li>
          </ul>
        </>
      )}
    </section>
  );
}
