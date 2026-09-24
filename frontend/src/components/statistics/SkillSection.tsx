import { useState } from 'react';
import type { ChampionshipStats } from '../../lib/api';
import { fmtDec, fmtInt, fmtPct } from '../../lib/statsFormat';
import { BarList, EmptyState, Histogram, RankingButton, SectionHeader, StatCard } from './StatsUi';

type Skill = ChampionshipStats['skills'][number];

function SkillDetail({ skill, runs, onRanking }: { skill: Skill; runs: number; onRanking: () => void }) {
  return (
    <div className="stats-skill-detail">
      <div className="stats-cards stats-cards--compact">
        <StatCard icon="📈" label="Nível médio"          value={fmtDec(skill.avg)} />
        <StatCard icon="🔟" label="Chegaram ao nível 10" value={fmtInt(skill.count10)} />
        <StatCard icon="%"  label="Taxa de nível 10"     value={fmtPct(skill.pct10)} />
        <StatCard icon="0️⃣" label="Nunca evoluíram"      value={fmtInt(skill.count0)} hint="Runs com a skill no nível 0" />
      </div>
      <h4 className="stats-subtitle">Runs por nível — {skill.name}</h4>
      <Histogram columns={skill.dist.map((count, lvl) => ({
        label: String(lvl),
        count,
        tip:   `Nível ${lvl}: ${fmtInt(count)} runs (${fmtPct(runs ? (count / runs) * 100 : 0)})`,
      }))} />
      <div className="stats-section-foot">
        <span className="stats-bar-meta">Tempo médio até o nível 10: dados ainda não disponíveis.</span>
        <RankingButton onClick={onRanking} />
      </div>
    </div>
  );
}

export function SkillSection({ data, runs, onRanking }: {
  data: ChampionshipStats['skills']; runs: number; onRanking: (skill: string) => void;
}) {
  const [order, setOrder]       = useState<'most' | 'least'>('most');
  const [selected, setSelected] = useState<string | null>(null);

  if (runs === 0) {
    return (
      <section className="stats-section">
        <SectionHeader id="skills" icon="🧠" title="Habilidades" />
        <EmptyState text="Nenhuma run para os filtros escolhidos." />
      </section>
    );
  }

  const byPct = [...data].sort((a, b) => order === 'most'
    ? b.pct10 - a.pct10 || b.avg - a.avg
    : a.pct10 - b.pct10 || a.avg - b.avg);

  return (
    <section className="stats-section">
      <SectionHeader
        id="skills" icon="🧠" title="Habilidades"
        sub="Nível atual de cada skill por run. Bônus de profissão e traits contam — por isso algumas skills já começam acima de 0."
      />

      <h3 className="stats-subtitle">Quais habilidades mais chegam ao nível 10</h3>
      <div className="stats-toolbar">
        <div className="stats-seg" role="group" aria-label="Ordenação">
          <button type="button" className={order === 'most' ? 'active' : ''} onClick={() => setOrder('most')}>Mais chegam ao 10</button>
          <button type="button" className={order === 'least' ? 'active' : ''} onClick={() => setOrder('least')}>Menos chegam ao 10</button>
        </div>
      </div>
      <BarList key={order} initial={12} items={byPct.map(s => ({
        key:     s.name,
        label:   <span>{s.name}</span>,
        value:   s.pct10,
        display: fmtPct(s.pct10),
        tip:     `${s.name} — ${fmtInt(s.count10)} runs no nível 10 (${fmtPct(s.pct10)}) · nível médio ${fmtDec(s.avg)}`,
      }))} />

      <h3 className="stats-subtitle">Todas as habilidades</h3>
      <p className="stats-section-sub">Toque em uma habilidade para ver a distribuição por nível.</p>
      <div className="stats-table-wrap">
        <table className="stats-table stats-table--clickable">
          <thead>
            <tr>
              <th>Habilidade</th>
              <th className="num">Nível médio</th>
              <th className="num">Nível 10</th>
              <th className="num">% nível 10</th>
              <th className="num">Nunca evoluíram</th>
            </tr>
          </thead>
          <tbody>
            {[...data].sort((a, b) => b.avg - a.avg).map(s => (
              <SkillRow key={s.name} skill={s} runs={runs} open={selected === s.name}
                onToggle={() => setSelected(cur => cur === s.name ? null : s.name)}
                onRanking={() => onRanking(s.name)} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SkillRow({ skill, runs, open, onToggle, onRanking }: {
  skill: Skill; runs: number; open: boolean; onToggle: () => void; onRanking: () => void;
}) {
  return (
    <>
      <tr className={open ? 'is-open' : ''}>
        <td>
          <button type="button" className="stats-row-btn" aria-expanded={open} onClick={onToggle}>
            <i className={`ti ti-chevron-${open ? 'down' : 'right'}`} aria-hidden="true" /> {skill.name}
          </button>
        </td>
        <td className="num">{fmtDec(skill.avg)}</td>
        <td className="num">{fmtInt(skill.count10)}</td>
        <td className="num">{fmtPct(skill.pct10)}</td>
        <td className="num">{fmtInt(skill.count0)}</td>
      </tr>
      {open && (
        <tr className="stats-detail-row">
          <td colSpan={5}><SkillDetail skill={skill} runs={runs} onRanking={onRanking} /></td>
        </tr>
      )}
    </>
  );
}
