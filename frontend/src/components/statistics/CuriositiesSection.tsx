import type { ReactNode } from 'react';
import type { ChampionshipStats } from '../../lib/api';
import { resolveTrait } from '../../lib/traits';
import { fmtDays, fmtInt, fmtPct } from '../../lib/statsFormat';
import { EmptyState, SectionHeader } from './StatsUi';

type Curiosity = ChampionshipStats['curiosities'][number];

// Frases sempre DESCRITIVAS ("tiveram média de..."), nunca causais ("é a melhor").
function sentence(c: Curiosity): ReactNode | null {
  const runs = c.runs != null ? ` (${fmtInt(c.runs)} runs)` : '';
  switch (c.kind) {
    case 'profession_longest':
      return <>Entre as profissões com 5+ runs, quem começou como <strong>{c.name}</strong> teve a maior média de sobrevivência: <strong>{fmtDays(c.value)}</strong>{runs}.</>;
    case 'profession_kills':
      return <>Entre as profissões com 5+ runs, <strong>{c.name}</strong> teve a maior média de zumbis mortos: <strong>{fmtInt(c.value)}</strong> por run{runs}.</>;
    case 'trait_most_used':
      return <>O trait mais escolhido é <strong>{resolveTrait(c.key ?? '').name}</strong>, presente em <strong>{fmtPct(c.value)}</strong> das runs.</>;
    case 'trait_longest':
      return <>Entre os traits com 5+ runs, as runs com <strong>{resolveTrait(c.key ?? '').name}</strong> tiveram a maior média de sobrevivência: <strong>{fmtDays(c.value)}</strong>{runs}.</>;
    case 'skill_most_maxed':
      return <><strong>{c.name}</strong> é a habilidade que mais chega ao nível 10: <strong>{fmtPct(c.value)}</strong> das runs.</>;
    case 'skill_least_maxed':
      return <><strong>{c.name}</strong> é a habilidade que menos chega ao nível 10: <strong>{fmtPct(c.value)}</strong> das runs.</>;
    case 'kills_before_death':
      return <>Runs encerradas mataram em média <strong>{fmtInt(c.value)}</strong> zumbis antes da morte{runs}.</>;
    case 'survived_30':
      return <><strong>{fmtPct(c.value)}</strong> das runs passaram de 30 dias sobrevividos{runs}.</>;
    default:
      return null;
  }
}

export function CuriositiesSection({ data }: { data: ChampionshipStats['curiosities'] }) {
  const items = data.map(c => ({ kind: c.kind, node: sentence(c) })).filter(i => i.node);
  return (
    <section className="stats-section">
      <SectionHeader
        id="curiosidades" icon="🔎" title="Curiosidades do campeonato"
        sub="Estatística descritiva: mostra o que aconteceu, não o que causou. Correlação não é causalidade."
      />
      {items.length === 0 ? <EmptyState text="Dados insuficientes para os filtros escolhidos." /> : (
        <ul className="stats-curiosities">
          {items.map(i => <li key={i.kind}>{i.node}</li>)}
        </ul>
      )}
    </section>
  );
}
