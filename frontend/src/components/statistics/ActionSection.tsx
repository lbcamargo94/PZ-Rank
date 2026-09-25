import { useState } from 'react';
import type { ChampionshipStats, StatsAction } from '../../lib/api';
import { ACTION_GROUP_LABELS, actionLabel } from '../../lib/actionLabels';
import { fmtDec, fmtInt, fmtPct, fmtRange } from '../../lib/statsFormat';
import { EmptyState, HolderLine, Histogram, RankingButton, SectionHeader, StatCard } from './StatsUi';

function headline(a: StatsAction): { value: string; caption: string } {
  const { unit } = actionLabel(a.key);
  return a.kind === 'sum'
    ? { value: fmtInt(a.total ?? 0), caption: `${unit} no total` }
    : { value: fmtDec(a.avg), caption: `${unit} em média por run` };
}

function ActionDetail({ action, onRanking }: { action: StatsAction; onRanking: () => void }) {
  const { label, unit } = actionLabel(action.key);
  const runs = action.runs;
  if (runs === 0) {
    return (
      <div className="stats-action-detail" aria-live="polite">
        <h4 className="stats-subtitle">{label}</h4>
        <p className="stats-section-sub">
          Este número começou a ser contado no mod {action.since_mod}. Ele aparece aqui assim que os
          jogadores sincronizarem com a versão nova do mod.
        </p>
      </div>
    );
  }
  return (
    <div className="stats-action-detail" aria-live="polite">
      <h4 className="stats-subtitle">{label}</h4>
      <div className="stats-cards stats-cards--compact">
        {action.kind === 'sum' && <StatCard icon="Σ" label="Total do campeonato" value={fmtInt(action.total ?? 0)} />}
        <StatCard icon="📈" label="Média por run"  value={fmtDec(action.avg)} />
        <StatCard icon="⚖️" label="Mediana"         value={fmtDec(action.median)} hint="Metade das runs ficou até este valor" />
        <StatCard icon="🏆" label="Maior valor"     value={fmtInt(action.max)} />
        <StatCard icon="✅" label="Runs que fizeram" value={fmtPct(action.pct_done)} hint={`${fmtInt(action.runs_done)} de ${fmtInt(runs)} runs com dados`} />
      </div>
      <h4 className="stats-subtitle">Distribuição de runs</h4>
      <Histogram columns={action.buckets.map(b => ({
        label: b.min === 0 && b.max === 0 ? 'Nenhum' : fmtRange(b.min, b.max),
        count: b.count,
        tip:   `${b.min === 0 && b.max === 0 ? 'Nenhum' : fmtRange(b.min, b.max, unit)}: ${fmtInt(b.count)} runs (${fmtPct(runs ? (b.count / runs) * 100 : 0)})`,
      }))} />
      <div className="stats-section-foot">
        <HolderLine holder={action.top} format={v => `${fmtInt(v)} ${unit}`} />
        <RankingButton onClick={onRanking} />
      </div>
    </div>
  );
}

export function ActionSection({ data, onRanking }: {
  data: ChampionshipStats['actions']; onRanking: (key: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { runs_with_data: runs, runs_total: total } = data;

  return (
    <section className="stats-section">
      <SectionHeader
        id="acoes" icon="🎮" title="O que os sobreviventes fazem"
        sub={runs > 0
          ? `Baseado em ${fmtInt(runs)} de ${fmtInt(total)} runs que já enviaram esses dados. O número cresce conforme os jogadores sincronizam com o Companion atualizado.`
          : undefined}
      />
      {runs === 0 ? (
        <EmptyState text="Ainda não há runs com esses dados para os filtros escolhidos. Eles chegam conforme os jogadores sincronizam com o Companion atualizado." />
      ) : (
        data.groups.map(g => {
          const gl = ACTION_GROUP_LABELS[g.id] ?? { icon: '•', title: g.id };
          const open = g.actions.find(a => a.key === selected);
          return (
            <div key={g.id} className="stats-action-group">
              <h3 className="stats-subtitle"><span aria-hidden="true">{gl.icon}</span> {gl.title}</h3>
              <div className="stats-action-grid">
                {g.actions.map(a => {
                  const { icon, label } = actionLabel(a.key);
                  const h = headline(a);
                  const waiting = a.runs === 0;
                  return (
                    <button
                      key={a.key} type="button"
                      className={`stats-action-tile${selected === a.key ? ' is-open' : ''}`}
                      aria-expanded={selected === a.key}
                      onClick={() => setSelected(cur => cur === a.key ? null : a.key)}
                    >
                      <span className="stats-action-icon" aria-hidden="true">{icon}</span>
                      <span className="stats-action-label">{label}</span>
                      {waiting ? (
                        <span className="stats-action-caption">Aguardando dados (mod {a.since_mod}+)</span>
                      ) : (
                        <>
                          <span className="stats-action-value">{h.value}</span>
                          <span className="stats-action-caption">{h.caption}</span>
                          <span className="stats-action-caption">
                            {fmtPct(a.pct_done)} das runs{a.since_mod ? ` · desde o mod ${a.since_mod}` : ''}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              {open && <ActionDetail action={open} onRanking={() => onRanking(open.key)} />}
            </div>
          );
        })
      )}
    </section>
  );
}
