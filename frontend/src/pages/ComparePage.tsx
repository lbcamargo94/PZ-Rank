import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGetAllEntries } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES } from '../lib/skills';
import {
  SPIFFOS_RESTAURANTS,
  SCORE_KILLS_PER_KILL, SCORE_KILLS_MAX, SCORE_SKILL_LEVEL,
  SCORE_SPIFFO_DONE, SCORE_MILITARY, SCORE_SPIFFO_HQ, SCORE_SPIFFO_RELIC,
  MAX_POSSIBLE_SCORE, sumSkillLevels, countSkills10, mergeObjectives,
} from '../lib/objectives';
import type { Entry } from '../types';
import type { Objectives } from '../lib/objectives';
import './compare.css';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab         = 'resumo' | 'confronto' | 'habilidades';
type SkillFilter = 'all' | 'a-leads' | 'b-leads' | 'tied' | 'maxed';

interface ScoreBreakdown {
  killPts: number; skillPts: number; spiffoPts: number;
  militaryPts: number; hqPts: number; relicPts: number;
  spiffoCount: number; total: number;
}

interface Insight {
  icon: string; label: string; detail: string; winner: 'a' | 'b' | 'tie';
}

interface CatchUpCombo { items: string[]; }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtNum(n: number)  { return n.toLocaleString('pt-BR'); }
function fmtHours(raw: number) {
  const h = Math.floor(raw / 3600), m = Math.floor((raw % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
function pct(a: number, b: number) {
  const max = Math.max(a, b); return max === 0 ? 0 : Math.round((a / max) * 100);
}
function dedup(entries: Entry[]): Entry[] {
  const map = new Map<number, Entry>();
  for (const e of entries) {
    if (e.player_id == null) continue;
    const ex = map.get(e.player_id);
    if (!ex || e.score > ex.score) map.set(e.player_id, e);
  }
  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );
}

function computeBreakdown(entry: Entry, objs: Objectives): ScoreBreakdown {
  const killPts    = Math.round(Math.min(entry.kills, SCORE_KILLS_MAX) * SCORE_KILLS_PER_KILL);
  const skillPts   = sumSkillLevels(entry.skills) * SCORE_SKILL_LEVEL;
  const spiffoCount = SPIFFOS_RESTAURANTS.filter(r => objs.bases?.[r.id]?.has_base).length;
  const spiffoPts  = spiffoCount * SCORE_SPIFFO_DONE;
  const militaryPts = objs.military_base ? SCORE_MILITARY : 0;
  const hqPts      = objs.spiffo_hq     ? SCORE_SPIFFO_HQ  : 0;
  const relicPts   = objs.spiffo_relic  ? SCORE_SPIFFO_RELIC : 0;
  return { killPts, skillPts, spiffoPts, militaryPts, hqPts, relicPts, spiffoCount,
    total: killPts + skillPts + spiffoPts + militaryPts + hqPts + relicPts };
}

function buildInsights(
  eA: Entry, eB: Entry,
  bkA: ScoreBreakdown, bkB: ScoreBreakdown,
): Insight[] {
  function cmp(a: number, b: number): 'a' | 'b' | 'tie' {
    return a > b ? 'a' : b > a ? 'b' : 'tie';
  }
  const sk10A = countSkills10(eA.skills), sk10B = countSkills10(eB.skills);
  const killDiff = Math.abs(eA.kills - eB.kills);
  const scoreDiff = Math.abs(eA.score - eB.score);
  const spDiff = Math.abs(bkA.spiffoCount - bkB.spiffoCount);
  return [
    {
      icon: 'ti-trophy', label: 'Pontuação total',
      winner: cmp(eA.score, eB.score),
      detail: scoreDiff > 0 ? `${fmtNum(scoreDiff)} pts de diferença` : 'Empatados',
    },
    {
      icon: 'ti-skull', label: 'Extermínio',
      winner: cmp(eA.kills, eB.kills),
      detail: killDiff > 0 ? `+${fmtNum(killDiff)} kills` : 'Empatados',
    },
    {
      icon: 'ti-sparkles', label: 'Habilidades nível 10',
      winner: cmp(sk10A, sk10B),
      detail: sk10A !== sk10B ? `+${Math.abs(sk10A - sk10B)} habilidades` : 'Empatados',
    },
    {
      icon: 'ti-building-store', label: 'Reconstrução de Spiffo\'s',
      winner: cmp(bkA.spiffoCount, bkB.spiffoCount),
      detail: spDiff > 0 ? `+${spDiff} Spiffo's` : 'Empatados',
    },
    {
      icon: 'ti-flag', label: 'Objetivos principais',
      winner: cmp(bkA.militaryPts + bkA.hqPts + bkA.relicPts, bkB.militaryPts + bkB.hqPts + bkB.relicPts),
      detail: (() => {
        const dA = bkA.militaryPts + bkA.hqPts + bkA.relicPts;
        const dB = bkB.militaryPts + bkB.hqPts + bkB.relicPts;
        return dA === dB ? 'Empatados' : `${fmtNum(Math.abs(dA - dB))} pts de vantagem`;
      })(),
    },
  ];
}

function getCatchUpCombos(gap: number, chaser: Entry, objs: Objectives): CatchUpCombo[] {
  if (gap <= 0) return [];
  const killsAvail  = Math.max(0, SCORE_KILLS_MAX - chaser.kills);
  const spDone      = SPIFFOS_RESTAURANTS.filter(r => objs.bases?.[r.id]?.has_base).length;
  const spAvail     = SPIFFOS_RESTAURANTS.length - spDone;
  const milAvail    = !objs.military_base;
  const hqAvail     = !objs.spiffo_hq;
  const relicAvail  = !objs.spiffo_relic;

  function killsForRemainder(rem: number) {
    if (rem <= 0) return 0;
    const needed = Math.ceil(rem / SCORE_KILLS_PER_KILL);
    return needed <= killsAvail ? needed : null;
  }

  const combos: CatchUpCombo[] = [];

  // 1. Pure kills
  const pk = killsForRemainder(gap);
  if (pk !== null && pk > 0) combos.push({ items: [`${fmtNum(pk)} kills`] });

  // 2. Objectives + kills
  let objPts = 0; const objLabels: string[] = [];
  if (milAvail)   { objPts += SCORE_MILITARY;    objLabels.push('Base Militar (+5.000)'); }
  if (hqAvail)    { objPts += SCORE_SPIFFO_HQ;   objLabels.push("Sede do Spiffo's (+5.000)"); }
  if (relicAvail) { objPts += SCORE_SPIFFO_RELIC; objLabels.push('Relíquia (+3.000)'); }
  if (objPts > 0 && objPts < gap * 2) {
    const rem2 = Math.max(0, gap - objPts);
    const k2 = killsForRemainder(rem2);
    if (k2 !== null) {
      const items = [...objLabels];
      if (k2 > 0) items.push(`${fmtNum(k2)} kills adicionais`);
      combos.push({ items });
    }
  }

  // 3. Spiffo's + kills
  if (spAvail > 0) {
    const spNeed = Math.min(spAvail, Math.ceil(gap / SCORE_SPIFFO_DONE));
    const spPts  = spNeed * SCORE_SPIFFO_DONE;
    const rem3   = Math.max(0, gap - spPts);
    const k3     = killsForRemainder(rem3);
    if (k3 !== null) {
      const items = [`${spNeed} Spiffo's (+${fmtNum(spPts)} pts)`];
      if (k3 > 0) items.push(`${fmtNum(k3)} kills adicionais`);
      combos.push({ items });
    }
  }

  // 4. Mix objectives + Spiffo's
  if (objPts > 0 && spAvail > 0) {
    const spExtra = Math.min(spAvail, 3);
    const mixPts  = objPts + spExtra * SCORE_SPIFFO_DONE;
    const rem4    = Math.max(0, gap - mixPts);
    const k4      = killsForRemainder(rem4);
    if (k4 !== null) {
      const items = [...objLabels, `${spExtra} Spiffo's`];
      if (k4 > 0) items.push(`${fmtNum(k4)} kills adicionais`);
      combos.push({ items });
    }
  }

  // deduplicate and cap at 4
  const seen = new Set<string>();
  return combos.filter(c => {
    const key = c.items.join('|');
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 4);
}

// ── Player Picker ──────────────────────────────────────────────────────────

interface PickerProps {
  label: string; side: 'a' | 'b';
  value: Entry | null; entries: Entry[];
  exclude: number | null; onChange: (e: Entry | null) => void;
  rankOf: (id: number | null | undefined) => number | null;
}
function PlayerPicker({ label, side, value, entries, exclude, onChange, rankOf }: PickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(ev: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => e.player_id !== exclude && (!q || e.name.toLowerCase().includes(q))).slice(0, 10);
  }, [entries, query, exclude]);
  return (
    <div>
      <div className={`cmp-picker-label c-${side}`}>{label}</div>
      <div className="cmp-picker-wrap" ref={wrapRef}>
        <input
          className={`cmp-picker-input c-${side}`}
          placeholder="Buscar jogador..."
          value={open ? query : (value ? value.name : '')}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {value && !open && (
          <button className="cmp-picker-clear" onClick={() => { onChange(null); setQuery(''); }} aria-label="Remover">
            <i className="ti ti-x" />
          </button>
        )}
        {open && filtered.length > 0 && (
          <ul className="cmp-picker-dropdown">
            {filtered.map(e => {
              const r = rankOf(e.player_id);
              return (
                <li key={e.player_id} onMouseDown={() => { onChange(e); setOpen(false); setQuery(''); }}>
                  <span className="cmp-drop-name">{e.name}</span>
                  <span className="cmp-entry-sub">
                    {r ? `#${r} · ` : ''}{e.is_alive ? '🟢' : '💀'} {fmtNum(e.score)}pts
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {open && query && filtered.length === 0 && (
          <ul className="cmp-picker-dropdown">
            <li style={{ color: 'var(--text-4)', cursor: 'default' }}>Nenhum resultado</li>
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Avatar (initials-based) ────────────────────────────────────────────────

function Avatar({ name, side }: { name: string; side: 'a' | 'b' }) {
  const initials = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??';
  return <div className={`cmp-avatar c-${side}-bg`}>{initials}</div>;
}

// ── Hero Card ──────────────────────────────────────────────────────────────

function HeroCard({ entry, side, rank }: { entry: Entry; side: 'a' | 'b'; rank: number | null }) {
  const prog = Math.min(100, Math.round((entry.score / MAX_POSSIBLE_SCORE) * 100));
  return (
    <div className={`cmp-hero-card c-${side}`}>
      <Avatar name={entry.name} side={side} />
      <div className="cmp-hero-info">
        <div className="cmp-hero-nick">{entry.name}</div>
        {entry.character_name && <div className="cmp-hero-char">{entry.character_name}</div>}
        <div className="cmp-hero-badges">
          {rank && <span className="cmp-rank-badge">#{rank}</span>}
          <span className={`cmp-alive c-alive-${entry.is_alive ? 'yes' : 'no'}`}>
            <i className={`ti ${entry.is_alive ? 'ti-heartbeat' : 'ti-skull'}`} />
            {entry.is_alive ? 'Vivo' : 'Morto'}
          </span>
        </div>
        <div className="cmp-hero-score">{fmtNum(entry.score)}<span className="cmp-hero-pts">pts</span></div>
        <div className="cmp-hero-prog-wrap" title={`${prog}% do progresso máximo`}>
          <div className="cmp-hero-prog-bar">
            <div className={`cmp-hero-prog-fill c-${side}-bg`} style={{ width: `${prog}%` }} />
          </div>
          <span className="cmp-hero-prog-pct">{prog}%</span>
        </div>
        {entry.player_id != null && (
          <Link to={`/player/${entry.player_id}`} className={`cmp-hero-profile-btn c-${side}-btn`}>
            <i className="ti ti-user" /> Ver Perfil
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Stat Row ───────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: string; label: string;
  valA: number | null | undefined; valB: number | null | undefined;
  format?: 'number' | 'time'; higherWins?: boolean;
  unit?: string;
}
function StatRow({ icon, label, valA, valB, format = 'number', higherWins = true, unit }: StatRowProps) {
  const a = valA ?? 0, b = valB ?? 0;
  const aW = higherWins ? a > b : a < b;
  const bW = higherWins ? b > a : b < a;
  const diff = Math.abs(a - b);
  const delta = diff === 0 ? '' : format === 'time' ? fmtHours(diff) : fmtNum(diff);
  function fmt(v: number | null | undefined) {
    if (v == null) return '—';
    const s = format === 'time' ? fmtHours(v) : fmtNum(v);
    return unit ? `${s} ${unit}` : s;
  }
  return (
    <div className="cmp-row">
      <div className="cmp-row-a">
        <span className={`cmp-rval ${aW ? 'win-a' : bW ? 'lose' : 'tie'}`}>{fmt(valA)}</span>
        <div className="cmp-bar-wrap">
          <div className={`cmp-bar bar-a${!aW && bW ? ' dim' : ''}`} style={{ width: `${pct(a, b)}%` }} />
        </div>
      </div>
      <div className="cmp-row-lbl">
        <i className={`ti ${icon}`} />
        <span>{label}</span>
        {delta && <span className={`cmp-delta ${aW ? 'c-a-txt' : bW ? 'c-b-txt' : ''}`}>+{delta}</span>}
      </div>
      <div className="cmp-row-b">
        <span className={`cmp-rval ${bW ? 'win-b' : aW ? 'lose' : 'tie'}`}>{fmt(valB)}</span>
        <div className="cmp-bar-wrap">
          <div className={`cmp-bar bar-b${!bW && aW ? ' dim' : ''}`} style={{ width: `${pct(b, a)}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Placar Geral ───────────────────────────────────────────────────────────

function PlacarCard({ winsA, winsB, nameA, nameB }: {
  winsA: number; winsB: number; nameA: string; nameB: string;
}) {
  const total = winsA + winsB;
  const pA = total === 0 ? 50 : Math.round((winsA / total) * 100);
  return (
    <div className="cmp-card">
      <div className="cmp-card-title"><i className="ti ti-trophy" /> Placar Geral</div>
      <div className="cmp-sb-names">
        <span className="c-a-txt">{nameA}</span>
        <span className="c-b-txt">{nameB}</span>
      </div>
      <div className="cmp-sb-nums">
        <span className={`cmp-sb-big ${winsA >= winsB ? 'c-a-txt' : 'c-muted'}`}>{winsA}</span>
        <span className="cmp-sb-cats">categorias vencidas</span>
        <span className={`cmp-sb-big ${winsB >= winsA ? 'c-b-txt' : 'c-muted'}`}>{winsB}</span>
      </div>
      <div className="cmp-splitbar">
        <div className="cmp-split-a" style={{ width: `${pA}%` }} />
        <div className="cmp-split-b" style={{ width: `${100 - pA}%` }} />
      </div>
      <div className="cmp-verdict">
        {winsA > winsB && <><i className="ti ti-crown" /> <b className="c-a-txt">{nameA}</b> está na frente</>}
        {winsB > winsA && <><i className="ti ti-crown" /> <b className="c-b-txt">{nameB}</b> está na frente</>}
        {winsA === winsB && total > 0 && <><i className="ti ti-scale" /> Empate técnico</>}
        {total === 0 && <><i className="ti ti-minus" /> Sem dados suficientes</>}
      </div>
    </div>
  );
}

// ── Composição da Pontuação ────────────────────────────────────────────────

function ScoreCompositionCard({ bkA, bkB, nameA, nameB }: {
  bkA: ScoreBreakdown; bkB: ScoreBreakdown; nameA: string; nameB: string;
}) {
  const rows = [
    { icon: 'ti-skull',          label: 'Kills',             a: bkA.killPts,     b: bkB.killPts,     note: `×${SCORE_KILLS_PER_KILL}` },
    { icon: 'ti-sparkles',       label: 'Habilidades',       a: bkA.skillPts,    b: bkB.skillPts,    note: `${SCORE_SKILL_LEVEL}pts/nível` },
    { icon: 'ti-building-store', label: "Spiffo's",          a: bkA.spiffoPts,   b: bkB.spiffoPts,   note: `${fmtNum(bkA.spiffoCount)}×1000 / ${fmtNum(bkB.spiffoCount)}×1000` },
    { icon: 'ti-shield',         label: 'Base Militar',      a: bkA.militaryPts, b: bkB.militaryPts, note: '5.000 pts' },
    { icon: 'ti-building',       label: "Sede do Spiffo's",  a: bkA.hqPts,       b: bkB.hqPts,       note: '5.000 pts' },
    { icon: 'ti-diamond',        label: 'Relíquia',          a: bkA.relicPts,    b: bkB.relicPts,    note: '3.000 pts' },
  ];
  const maxVal = Math.max(bkA.total, bkB.total, 1);
  return (
    <div className="cmp-card">
      <div className="cmp-card-title"><i className="ti ti-chart-pie" /> Composição da Pontuação</div>
      <div className="cmp-comp-header">
        <span />
        <span className="c-a-txt cmp-comp-name">{nameA}</span>
        <span className="c-b-txt cmp-comp-name">{nameB}</span>
      </div>
      {rows.map(r => {
        const aW = r.a > r.b, bW = r.b > r.a;
        return (
          <div key={r.label} className="cmp-comp-row">
            <span className="cmp-comp-lbl"><i className={`ti ${r.icon}`} /> {r.label}</span>
            <span className={`cmp-comp-val ${aW ? 'win-a' : bW ? 'lose' : 'tie'}`}>{fmtNum(r.a)}</span>
            <span className={`cmp-comp-val ${bW ? 'win-b' : aW ? 'lose' : 'tie'}`}>{fmtNum(r.b)}</span>
          </div>
        );
      })}
      <div className="cmp-comp-row cmp-comp-total">
        <span className="cmp-comp-lbl">TOTAL</span>
        <span className={`cmp-comp-val ${bkA.total >= bkB.total ? 'win-a' : 'lose'}`}>{fmtNum(bkA.total)}</span>
        <span className={`cmp-comp-val ${bkB.total >= bkA.total ? 'win-b' : 'lose'}`}>{fmtNum(bkB.total)}</span>
      </div>
      {/* Stacked bars */}
      <div className="cmp-comp-bars">
        {[
          { bk: bkA, side: 'a' as const },
          { bk: bkB, side: 'b' as const },
        ].map(({ bk, side }) => (
          <div key={side} className="cmp-comp-bar-row">
            <span className={`cmp-comp-bar-name c-${side}-txt`}>{side === 'a' ? nameA : nameB}</span>
            <div className="cmp-comp-stack">
              {[bk.killPts, bk.skillPts, bk.spiffoPts, bk.militaryPts + bk.hqPts + bk.relicPts].map((v, i) => {
                const labels = ['Kills', 'Habilidades', "Spiffo's", 'Objetivos'];
                const colors = ['var(--cmp-seg-kill)', 'var(--cmp-seg-skill)', 'var(--cmp-seg-spiffo)', 'var(--cmp-seg-obj)'];
                const w = Math.round((v / maxVal) * 100);
                return w > 0 ? (
                  <div key={i} className="cmp-comp-seg" style={{ width: `${w}%`, background: colors[i] }} title={`${labels[i]}: ${fmtNum(v)} pts`} />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="cmp-comp-legend">
        <span><span className="cmp-leg-dot" style={{ background: 'var(--cmp-seg-kill)' }} /> Kills</span>
        <span><span className="cmp-leg-dot" style={{ background: 'var(--cmp-seg-skill)' }} /> Habilidades</span>
        <span><span className="cmp-leg-dot" style={{ background: 'var(--cmp-seg-spiffo)' }} /> Spiffo's</span>
        <span><span className="cmp-leg-dot" style={{ background: 'var(--cmp-seg-obj)' }} /> Objetivos</span>
      </div>
    </div>
  );
}

// ── Insights — Quem lidera em quê? ─────────────────────────────────────────

function InsightsCard({ insights, nameA, nameB }: {
  insights: Insight[]; nameA: string; nameB: string;
}) {
  return (
    <div className="cmp-card">
      <div className="cmp-card-title"><i className="ti ti-eye" /> Quem lidera em quê?</div>
      <div className="cmp-insights">
        {insights.map(ins => (
          <div key={ins.label} className={`cmp-insight cmp-ins-${ins.winner}`}>
            <i className={`ti ${ins.icon} cmp-ins-icon`} />
            <div className="cmp-ins-body">
              <div className="cmp-ins-label">{ins.label}</div>
              <div className="cmp-ins-detail">
                {ins.winner === 'a' && <><b className="c-a-txt">Vantagem: {nameA}</b> · {ins.detail}</>}
                {ins.winner === 'b' && <><b className="c-b-txt">Vantagem: {nameB}</b> · {ins.detail}</>}
                {ins.winner === 'tie' && <span className="c-muted">{ins.detail}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Catch-up Calculator ────────────────────────────────────────────────────

function CatchUpCard({ gap, chaser, leader, objs }: {
  gap: number; chaser: Entry; leader: Entry; objs: Objectives;
}) {
  const combos = useMemo(() => getCatchUpCombos(gap, chaser, objs), [gap, chaser, objs]);
  if (gap <= 0) return null;
  return (
    <div className="cmp-card">
      <div className="cmp-card-title"><i className="ti ti-route" /> Distância para Ultrapassar</div>
      <p className="cmp-catchup-gap">
        <b>{chaser.name}</b> está <b className="c-a-txt">{fmtNum(gap)}&nbsp;pts</b> atrás de <b>{leader.name}</b>.
      </p>
      {combos.length > 0 ? (
        <>
          <p className="cmp-catchup-sub">Combinações que fecham essa diferença:</p>
          <div className="cmp-catchup-combos">
            {combos.map((c, i) => (
              <div key={i} className="cmp-catchup-combo">
                <span className="cmp-catchup-n">{i + 1}</span>
                <ul>
                  {c.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="cmp-catchup-note">
            <i className="ti ti-info-circle" /> Estimativa baseada no progresso atual. Objetivos já concluídos não são sugeridos novamente.
          </p>
        </>
      ) : (
        <p className="cmp-catchup-sub c-muted">Não há combinações disponíveis com os objetivos restantes.</p>
      )}
    </div>
  );
}

// ── Extermínio Total (Kills vs meta) ───────────────────────────────────────

function KillsCard({ eA, eB, nameA, nameB }: {
  eA: Entry; eB: Entry; nameA: string; nameB: string;
}) {
  function KillBar({ entry, side }: { entry: Entry; side: 'a' | 'b' }) {
    const p = Math.min(100, Math.round((entry.kills / SCORE_KILLS_MAX) * 100));
    return (
      <div className="cmp-kill-row">
        <div className="cmp-kill-name-wrap">
          <span className={`cmp-kill-name c-${side}-txt`}>{side === 'a' ? nameA : nameB}</span>
          <span className="cmp-kill-pct">{p}%</span>
        </div>
        <div className="cmp-kill-bar">
          <div className={`cmp-kill-fill c-${side}-bg`} style={{ width: `${p}%` }} />
        </div>
        <span className="cmp-kill-val">{fmtNum(entry.kills)} <span className="c-muted">/ {fmtNum(SCORE_KILLS_MAX)}</span></span>
      </div>
    );
  }
  return (
    <div className="cmp-card">
      <div className="cmp-card-title">
        <i className="ti ti-skull" /> Extermínio Total
        <span className="cmp-card-meta">Meta: {fmtNum(SCORE_KILLS_MAX)} kills</span>
      </div>
      <KillBar entry={eA} side="a" />
      <KillBar entry={eB} side="b" />
      <div className="cmp-kill-diff">
        {eA.kills > eB.kills
          ? <><b className="c-a-txt">{nameA}</b> lidera com <b>+{fmtNum(eA.kills - eB.kills)}</b> kills</>
          : eB.kills > eA.kills
          ? <><b className="c-b-txt">{nameB}</b> lidera com <b>+{fmtNum(eB.kills - eA.kills)}</b> kills</>
          : <span className="c-muted">Empatados em kills</span>
        }
      </div>
      <div className="cmp-card-title" style={{ marginTop: '1rem', marginBottom: '.6rem' }}><i className="ti ti-chart-bar" /> Stats adicionais</div>
      <StatRow icon="ti-calendar" label="Dias sobrevividos" valA={eA.days}     valB={eB.days} />
      <StatRow icon="ti-clock"    label="Tempo em jogo"     valA={eA.time_raw} valB={eB.time_raw} format="time" />
    </div>
  );
}

// ── Grandes Objetivos ──────────────────────────────────────────────────────

function ObjectivesCard({ oA, oB, nameA, nameB, eA, eB }: {
  oA: Objectives; oB: Objectives; nameA: string; nameB: string; eA: Entry; eB: Entry;
}) {
  const bigObjs = [
    { key: 'military_base' as const, label: 'Base Militar Secreta', pts: SCORE_MILITARY, icon: 'ti-shield' },
    { key: 'spiffo_hq'     as const, label: "Sede do Spiffo's",     pts: SCORE_SPIFFO_HQ, icon: 'ti-building' },
    { key: 'spiffo_relic'  as const, label: 'Relíquia do Spiffo',   pts: SCORE_SPIFFO_RELIC, icon: 'ti-diamond' },
  ];
  return (
    <div className="cmp-card">
      <div className="cmp-card-title"><i className="ti ti-flag" /> Grandes Objetivos</div>
      <div className="cmp-obj-grid">
        <span className="cmp-obj-hdr" />
        <span className="cmp-obj-hdr c-a-txt">{nameA}</span>
        <span className="cmp-obj-hdr c-b-txt">{nameB}</span>
        {bigObjs.map(o => {
          const dA = oA[o.key], dB = oB[o.key];
          return (
            <div key={o.key} className="cmp-obj-row">
              <span className="cmp-obj-name"><i className={`ti ${o.icon}`} /> {o.label}<span className="cmp-obj-pts">+{fmtNum(o.pts)}</span></span>
              <span className={`cmp-obj-status ${dA ? 'done' : 'pend'}`}>{dA ? <><i className="ti ti-check" /> Concluído</> : <><i className="ti ti-clock" /> Pendente</>}</span>
              <span className={`cmp-obj-status ${dB ? 'done' : 'pend'}`}>{dB ? <><i className="ti ti-check" /> Concluído</> : <><i className="ti ti-clock" /> Pendente</>}</span>
            </div>
          );
        })}
      </div>

      <div className="cmp-card-title" style={{ marginTop: '1.25rem', marginBottom: '.75rem' }}>
        <i className="ti ti-building-store" /> Reconstrução dos Spiffo's
        <span className="cmp-card-meta">{eA.name}: {SPIFFOS_RESTAURANTS.filter(r => oA.bases?.[r.id]?.has_base).length}/{SPIFFOS_RESTAURANTS.length} · {eB.name}: {SPIFFOS_RESTAURANTS.filter(r => oB.bases?.[r.id]?.has_base).length}/{SPIFFOS_RESTAURANTS.length}</span>
      </div>
      <div className="cmp-spiffo-grid">
        <span className="cmp-spiffo-hdr">Local</span>
        <span className="cmp-spiffo-hdr c-a-txt">{nameA}</span>
        <span className="cmp-spiffo-hdr c-b-txt">{nameB}</span>
        {SPIFFOS_RESTAURANTS.map(r => {
          const dA = !!oA.bases?.[r.id]?.has_base;
          const dB = !!oB.bases?.[r.id]?.has_base;
          return (
            <div key={r.id} className="cmp-spiffo-row">
              <span className="cmp-spiffo-name"><i className="ti ti-map-pin" /> {r.name}</span>
              <span className={`cmp-spiffo-status ${dA ? 'done' : 'pend'}`}>{dA ? <i className="ti ti-check-circle" /> : <i className="ti ti-circle" />}</span>
              <span className={`cmp-spiffo-status ${dB ? 'done' : 'pend'}`}>{dB ? <i className="ti ti-check-circle" /> : <i className="ti ti-circle" />}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Habilidades ────────────────────────────────────────────────────────────

function SkillsCard({ eA, eB, nameA, nameB, skillsA, skillsB }: {
  eA: Entry; eB: Entry; nameA: string; nameB: string;
  skillsA: Map<string, number>; skillsB: Map<string, number>;
}) {
  const [filter, setFilter] = useState<SkillFilter>('all');
  const sk10A = countSkills10(eA.skills), sk10B = countSkills10(eB.skills);

  const filters: { key: SkillFilter; label: string }[] = [
    { key: 'all',     label: 'Todas'     },
    { key: 'a-leads', label: `${nameA} lidera` },
    { key: 'b-leads', label: `${nameB} lidera` },
    { key: 'tied',    label: 'Empatadas' },
    { key: 'maxed',   label: 'Nível 10'  },
  ];

  return (
    <div className="cmp-card">
      <div className="cmp-skill-summary">
        <div className="cmp-skill-sum-item">
          <span className={`cmp-skill-sum-n c-a-txt`}>{sk10A}</span>
          <span className="cmp-skill-sum-lbl">habilidades nível 10<br /><b>{nameA}</b></span>
        </div>
        <div className="cmp-skill-sum-sep" />
        <div className="cmp-skill-sum-item">
          <span className={`cmp-skill-sum-n c-b-txt`}>{sk10B}</span>
          <span className="cmp-skill-sum-lbl">habilidades nível 10<br /><b>{nameB}</b></span>
        </div>
      </div>

      <div className="cmp-filter-chips">
        {filters.map(f => (
          <button key={f.key} className={`cmp-chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {SKILL_CATEGORIES.map(cat => {
        const skills = cat.skills.filter(sk => {
          const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
          if (filter === 'a-leads') return a > b;
          if (filter === 'b-leads') return b > a;
          if (filter === 'tied')    return a === b;
          if (filter === 'maxed')   return a === 10 || b === 10;
          return true;
        });
        if (!skills.length) return null;
        let cA = 0, cB = 0;
        for (const sk of cat.skills) {
          const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
          if (a > b) cA++; else if (b > a) cB++;
        }
        return (
          <div key={cat.label} className="cmp-skill-cat">
            <div className="cmp-skill-cat-hdr">
              <span><i className="ti ti-sparkles" /> {cat.label}</span>
              <span className="cmp-cat-score">
                <b className={cA > cB ? 'c-a-txt' : ''}>{cA}</b>
                <span className="cmp-cat-sep">·</span>
                <b className={cB > cA ? 'c-b-txt' : ''}>{cB}</b>
              </span>
            </div>
            {skills.map(sk => {
              const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
              const aW = a > b, bW = b > a;
              return (
                <div key={sk.id} className="cmp-row cmp-sk-row">
                  <div className="cmp-row-a">
                    <span className={`cmp-rval ${aW ? 'win-a' : bW ? 'lose' : 'tie'}`}>{a}{a === 10 && <i className="ti ti-star-filled cmp-max-star" />}</span>
                    <SegBar level={a} side="a" dim={!aW && bW} />
                  </div>
                  <div className="cmp-row-lbl cmp-sk-name">{sk.name}</div>
                  <div className="cmp-row-b">
                    <span className={`cmp-rval ${bW ? 'win-b' : aW ? 'lose' : 'tie'}`}>{b}{b === 10 && <i className="ti ti-star-filled cmp-max-star" />}</span>
                    <SegBar level={b} side="b" dim={!bW && aW} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Segmented level bar (skills) ──────────────────────────────────────────

function SegBar({ level, side, dim }: { level: number; side: 'a' | 'b'; dim: boolean }) {
  return (
    <div className={`cmp-seg-bar seg-${side}`}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`cmp-seg ${i < level ? `seg-on seg-${side}${dim ? ' dim' : ''}` : 'seg-off'}`} />
      ))}
    </div>
  );
}

// ── EXT_STATS (usados no Confronto) ───────────────────────────────────────

const EXT_STATS = [
  { key: 'animals_killed',      icon: 'ti-paw',            label: 'Animais mortos'        },
  { key: 'fish_caught',         icon: 'ti-fish',           label: 'Peixes pescados'       },
  { key: 'crops_harvested',     icon: 'ti-seeding',        label: 'Colheitas'             },
  { key: 'crops_planted',       icon: 'ti-plant',          label: 'Plantados'             },
  { key: 'meals_cooked',        icon: 'ti-chef-hat',       label: 'Refeições cozinhadas'  },
  { key: 'items_crafted',       icon: 'ti-tools',          label: 'Itens fabricados'      },
  { key: 'materials_crafted',   icon: 'ti-hammer',         label: 'Materiais fabricados'  },
  { key: 'structures_built',    icon: 'ti-building',       label: 'Estruturas construídas'},
  { key: 'stone_structures',    icon: 'ti-wall',           label: 'Estruturas de pedra'   },
  { key: 'ceramic_items',       icon: 'ti-building',       label: 'Itens de cerâmica'     },
  { key: 'forged_weapons',      icon: 'ti-sword',          label: 'Armas forjadas'        },
  { key: 'books_read',          icon: 'ti-book',           label: 'Livros lidos'          },
  { key: 'houses_looted',       icon: 'ti-home',           label: 'Casas saqueadas'       },
  { key: 'trees_cut',           icon: 'ti-trees',          label: 'Árvores cortadas'      },
  { key: 'eggs_collected',      icon: 'ti-egg',            label: 'Ovos coletados'        },
  { key: 'milk_produced',       icon: 'ti-droplet',        label: 'Leite produzido (L)'   },
  { key: 'water_collected',     icon: 'ti-droplet',        label: 'Água coletada (L)'     },
  { key: 'km_driven',           icon: 'ti-car',            label: 'Km rodados'            },
  { key: 'cities_visited',      icon: 'ti-map-pin',        label: 'Cidades visitadas'     },
  { key: 'military_visited',    icon: 'ti-shield',         label: 'Bases militares'       },
  { key: 'animal_tracks',       icon: 'ti-paw-filled',     label: 'Rastros encontrados'   },
  { key: 'spiffo_visited',      icon: 'ti-building-store', label: "Restaurantes Spiffo's" },
  { key: 'hours_without_sleep', icon: 'ti-moon',           label: 'Horas sem dormir'      },
] as const;

// ── Main Component ─────────────────────────────────────────────────────────

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('resumo');
  const [copied, setCopied] = useState(false);

  const playerList = useMemo(() => dedup(allEntries), [allEntries]);
  const rankedList = useMemo(() =>
    [...playerList].sort((a, b) => b.score - a.score), [playerList]);
  const getRank = useCallback((pid: number | null | undefined) => {
    if (!pid) return null;
    const i = rankedList.findIndex(e => e.player_id === pid);
    return i >= 0 ? i + 1 : null;
  }, [rankedList]);

  const pidA = searchParams.get('a') ? Number(searchParams.get('a')) : null;
  const pidB = searchParams.get('b') ? Number(searchParams.get('b')) : null;
  const entryA = useMemo(() => playerList.find(e => e.player_id === pidA) ?? null, [playerList, pidA]);
  const entryB = useMemo(() => playerList.find(e => e.player_id === pidB) ?? null, [playerList, pidB]);

  useEffect(() => {
    apiGetAllEntries('score').then(setAllEntries).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const setA = useCallback((e: Entry | null) => {
    setSearchParams(p => { const n = new URLSearchParams(p); e?.player_id != null ? n.set('a', String(e.player_id)) : n.delete('a'); return n; }, { replace: true });
  }, [setSearchParams]);
  const setB = useCallback((e: Entry | null) => {
    setSearchParams(p => { const n = new URLSearchParams(p); e?.player_id != null ? n.set('b', String(e.player_id)) : n.delete('b'); return n; }, { replace: true });
  }, [setSearchParams]);

  const skillsA = useMemo(() => parseSkillMap(entryA?.skills ?? null), [entryA]);
  const skillsB = useMemo(() => parseSkillMap(entryB?.skills ?? null), [entryB]);
  const objsA = useMemo(() => mergeObjectives(entryA?.objectives), [entryA]);
  const objsB = useMemo(() => mergeObjectives(entryB?.objectives), [entryB]);
  const bkA   = useMemo(() => entryA ? computeBreakdown(entryA, objsA) : null, [entryA, objsA]);
  const bkB   = useMemo(() => entryB ? computeBreakdown(entryB, objsB) : null, [entryB, objsB]);

  const insights = useMemo(() =>
    entryA && entryB && bkA && bkB ? buildInsights(entryA, entryB, bkA, bkB) : [],
    [entryA, entryB, bkA, bkB]);

  // Win counts for scoreboard
  const { winsA, winsB } = useMemo(() => {
    if (!entryA || !entryB) return { winsA: 0, winsB: 0 };
    let wA = 0, wB = 0;
    // skills
    for (const cat of SKILL_CATEGORIES) {
      for (const sk of cat.skills) {
        const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
        if (a > b) wA++; else if (b > a) wB++;
      }
    }
    // ext stats
    for (const s of EXT_STATS) {
      const a = (entryA[s.key as keyof Entry] as number | null) ?? 0;
      const b = (entryB[s.key as keyof Entry] as number | null) ?? 0;
      if (a > b) wA++; else if (b > a) wB++;
    }
    // insights (score, kills, skills10, spiffos, objectives)
    for (const ins of insights) {
      if (ins.winner === 'a') wA++; else if (ins.winner === 'b') wB++;
    }
    return { winsA: wA, winsB: wB };
  }, [entryA, entryB, skillsA, skillsB, insights]);

  // Catch-up: who's behind and by how much
  const catchUp = useMemo(() => {
    if (!entryA || !entryB) return null;
    if (entryA.score >= entryB.score) return null;
    return { gap: entryB.score - entryA.score, chaser: entryA, leader: entryB, objs: objsA };
  }, [entryA, entryB, objsA]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  const both = !!(entryA && entryB);

  return (
    <div className="cmp-page">
      <header className="cmp-header">
        <Link to="/" className="cmp-back"><i className="ti ti-arrow-left" /> Início</Link>
        <h1><i className="ti ti-arrows-diff" /> Comparar Jogadores</h1>
      </header>

      {/* Selectors */}
      <div className="cmp-selectors">
        <PlayerPicker label="Jogador A" side="a" value={entryA} entries={playerList}
          exclude={entryB?.player_id ?? null} onChange={setA} rankOf={getRank} />
        <div className="cmp-vs-badge">VS</div>
        <PlayerPicker label="Jogador B" side="b" value={entryB} entries={playerList}
          exclude={entryA?.player_id ?? null} onChange={setB} rankOf={getRank} />
      </div>

      {loading && <div className="cmp-empty"><i className="ti ti-loader-2" /><span>Carregando jogadores...</span></div>}
      {!loading && !both && <div className="cmp-empty"><i className="ti ti-users" /><span>Escolha dois jogadores para comparar</span></div>}

      {both && (
        <>
          {/* Hero */}
          <div className="cmp-hero">
            <HeroCard entry={entryA!} side="a" rank={getRank(entryA!.player_id)} />
            <div className="cmp-hero-mid">
              <div className="cmp-vs-big">VS</div>
              <button className={`cmp-share${copied ? ' ok' : ''}`} onClick={copyUrl}>
                <i className={`ti ${copied ? 'ti-check' : 'ti-share'}`} />
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
            </div>
            <HeroCard entry={entryB!} side="b" rank={getRank(entryB!.player_id)} />
          </div>

          {/* Tabs */}
          <nav className="cmp-tabs">
            <button className={tab === 'resumo'      ? 'active' : ''} onClick={() => setTab('resumo')}>
              <i className="ti ti-layout-dashboard" /> Resumo
            </button>
            <button className={tab === 'confronto'   ? 'active' : ''} onClick={() => setTab('confronto')}>
              <i className="ti ti-swords" /> Confronto
            </button>
            <button className={tab === 'habilidades' ? 'active' : ''} onClick={() => setTab('habilidades')}>
              <i className="ti ti-sparkles" /> Habilidades
            </button>
          </nav>

          <div className="cmp-body">
            {/* ── Resumo ── */}
            {tab === 'resumo' && (
              <>
                <PlacarCard winsA={winsA} winsB={winsB} nameA={entryA!.name} nameB={entryB!.name} />
                {bkA && bkB && <ScoreCompositionCard bkA={bkA} bkB={bkB} nameA={entryA!.name} nameB={entryB!.name} />}
                <InsightsCard insights={insights} nameA={entryA!.name} nameB={entryB!.name} />
                {catchUp && <CatchUpCard {...catchUp} />}
                {!catchUp && entryA && entryB && entryA.score !== entryB.score && (
                  <CatchUpCard
                    gap={entryA.score - entryB.score}
                    chaser={entryB!} leader={entryA!} objs={objsB}
                  />
                )}
              </>
            )}

            {/* ── Confronto ── */}
            {tab === 'confronto' && (
              <>
                <KillsCard eA={entryA!} eB={entryB!} nameA={entryA!.name} nameB={entryB!.name} />
                <ObjectivesCard oA={objsA} oB={objsB} nameA={entryA!.name} nameB={entryB!.name} eA={entryA!} eB={entryB!} />
                {(() => {
                  const vis = EXT_STATS.filter(s => {
                    const a = (entryA![s.key as keyof Entry] as number | null) ?? 0;
                    const b = (entryB![s.key as keyof Entry] as number | null) ?? 0;
                    return a > 0 || b > 0;
                  });
                  if (!vis.length) return null;
                  return (
                    <div className="cmp-card">
                      <div className="cmp-card-title"><i className="ti ti-list-details" /> Outras Atividades</div>
                      {vis.map(s => (
                        <StatRow key={s.key} icon={s.icon} label={s.label}
                          valA={entryA![s.key as keyof Entry] as number | null}
                          valB={entryB![s.key as keyof Entry] as number | null}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* ── Habilidades ── */}
            {tab === 'habilidades' && (
              <SkillsCard
                eA={entryA!} eB={entryB!}
                nameA={entryA!.name} nameB={entryB!.name}
                skillsA={skillsA} skillsB={skillsB}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
