import { useMemo, useState } from 'react';
import type { ChampionshipStats } from '../../lib/api';
import { TRAITS, getTraitImageUrl, resolveTrait, type TraitDef } from '../../lib/traits';
import { fmtDays, fmtInt, fmtPct } from '../../lib/statsFormat';
import { BarList, EmptyState, SectionHeader } from './StatsUi';

type Group = 'positive' | 'negative' | 'other';

const KNOWN = new Set<TraitDef>(Object.values(TRAITS));

// Traits de mods (namespace ≠ base) ou fora do mapa do site não têm polaridade
// conhecida — ficam num grupo à parte em vez de serem chutados como positivos.
function classify(key: string): { def: TraitDef; group: Group } {
  const def = resolveTrait(key);
  return { def, group: KNOWN.has(def) ? def.type : 'other' };
}

const GROUP_LABEL: Record<Group, string> = { positive: 'Positivos', negative: 'Negativos', other: 'Outros (mods)' };

export function TraitSection({ traits, builds }: { traits: ChampionshipStats['traits']; builds: ChampionshipStats['trait_builds'] }) {
  const [group, setGroup] = useState<Group>('positive');
  const [order, setOrder] = useState<'most' | 'least'>('most');

  const classified = useMemo(() => traits.map(t => ({ ...t, ...classify(t.key) })), [traits]);
  const groups = (['positive', 'negative', 'other'] as Group[]).filter(g => g !== 'other' || classified.some(t => t.group === 'other'));

  const items = classified
    .filter(t => t.group === group)
    .sort((a, b) => order === 'most' ? b.runs - a.runs : a.runs - b.runs)
    .map(t => {
      const img = getTraitImageUrl(t.def);
      return {
        key:     t.key,
        value:   t.runs,
        display: fmtPct(t.pct),
        tip:     `${t.def.name} — escolhido em ${fmtInt(t.runs)} runs (${fmtPct(t.pct)}) por ${fmtInt(t.players)} jogadores · média de ${fmtDays(t.avg_days)}`,
        label: (
          <>
            {img
              ? <img src={img} alt="" className="stats-bar-img" loading="lazy" />
              : <span className="stats-bar-img" aria-hidden="true" />}
            <span>{t.def.name}</span>
          </>
        ),
      };
    });

  return (
    <section className="stats-section">
      <SectionHeader
        id="traits" icon="🧬" title="Traits mais escolhidos"
        sub="Percentual = runs que escolheram o trait. Cada run escolhe vários traits, então a soma passa de 100%."
      />
      <div className="stats-toolbar">
        <div className="stats-seg" role="tablist" aria-label="Tipo de trait">
          {groups.map(g => (
            <button key={g} type="button" role="tab" aria-selected={group === g}
              className={group === g ? 'active' : ''} onClick={() => setGroup(g)}>
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="stats-seg" role="group" aria-label="Ordenação">
          <button type="button" className={order === 'most' ? 'active' : ''} onClick={() => setOrder('most')}>Mais escolhidos</button>
          <button type="button" className={order === 'least' ? 'active' : ''} onClick={() => setOrder('least')}>Menos escolhidos</button>
        </div>
      </div>
      <BarList key={`${group}-${order}`} items={items} initial={12} />

      <h3 className="stats-subtitle">🧬 Builds repetidas</h3>
      <p className="stats-section-sub">
        Conjuntos de traits exatamente iguais usados por 2 ou mais runs.
      </p>
      {builds.length === 0 ? (
        <EmptyState text="Nenhum conjunto de traits se repetiu com os filtros escolhidos." />
      ) : (
        <ol className="stats-builds">
          {builds.map((b, i) => (
            <li key={b.traits.join(',')} className="stats-build">
              <div className="stats-build-head">
                <span className="stats-build-pos">#{i + 1}</span>
                <strong>{fmtInt(b.runs)} runs</strong>
                <span className="stats-bar-meta">média de {fmtDays(b.avg_days)}</span>
              </div>
              <div className="stats-build-traits">
                {b.traits.map(k => {
                  const { def, group: g } = classify(k);
                  return <span key={k} className={`stats-chip stats-chip--${g}`}>{def.name}</span>;
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
