import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGetAllEntries } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES } from '../lib/skills';
import type { Entry } from '../types';
import './compare.css';

type Tab = 'geral' | 'atividades' | 'habilidades';

function fmtScore(n: number): string { return n.toLocaleString('pt-BR'); }
function fmtHours(raw: number): string {
  const h = Math.floor(raw / 3600);
  const m = Math.floor((raw % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
function pct(a: number, b: number): number {
  const max = Math.max(a, b);
  return max === 0 ? 0 : Math.round((a / max) * 100);
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

// ── Player Picker ──────────────────────────────────────────────────────────

interface PickerProps {
  label: string; side: 'a' | 'b';
  value: Entry | null; entries: Entry[];
  exclude: number | null; onChange: (e: Entry | null) => void;
}
function PlayerPicker({ label, side, value, entries, exclude, onChange }: PickerProps) {
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
            {filtered.map(e => (
              <li key={e.player_id} onMouseDown={() => { onChange(e); setOpen(false); setQuery(''); }}>
                <span>{e.name}</span>
                <span className="cmp-entry-sub">{e.is_alive ? '🟢' : '💀'} {e.days}d · {fmtScore(e.score)}pts</span>
              </li>
            ))}
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

// ── Hero Card ──────────────────────────────────────────────────────────────

function HeroCard({ entry, side }: { entry: Entry; side: 'a' | 'b' }) {
  return (
    <div className={`cmp-hero-card c-${side}`}>
      <div className="cmp-hero-nick">{entry.name}</div>
      {entry.character_name && <div className="cmp-hero-char">{entry.character_name}</div>}
      <div className="cmp-hero-stats">
        <div className="cmp-hero-stat">
          <span className={`cmp-hero-val c-${side}-txt`}>{fmtScore(entry.score)}</span>
          <span className="cmp-hero-lbl">pts</span>
        </div>
        <span className="cmp-hero-sep" />
        <div className="cmp-hero-stat">
          <span className="cmp-hero-val">{entry.days}</span>
          <span className="cmp-hero-lbl">dias</span>
        </div>
        <span className="cmp-hero-sep" />
        <span className={`cmp-alive c-alive-${entry.is_alive ? 'yes' : 'no'}`}>
          <i className={`ti ${entry.is_alive ? 'ti-heartbeat' : 'ti-skull'}`} />
          {entry.is_alive ? 'Vivo' : 'Morto'}
        </span>
      </div>
    </div>
  );
}

// ── Scoreboard ─────────────────────────────────────────────────────────────

interface SectionWin { label: string; icon: string; wA: number; wB: number; }
function Scoreboard({ winsA, winsB, nameA, nameB, breakdown }: {
  winsA: number; winsB: number; nameA: string; nameB: string; breakdown: SectionWin[];
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
        <span className="cmp-sb-cats">categorias</span>
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
      <div className="cmp-bkd">
        {breakdown.map(s => (
          <div key={s.label} className="cmp-bkd-row">
            <span className={`cmp-bkd-n ${s.wA > s.wB ? 'c-a-txt' : s.wA < s.wB ? 'c-muted' : ''}`}>{s.wA}</span>
            <span className="cmp-bkd-lbl"><i className={`ti ${s.icon}`} /> {s.label}</span>
            <span className={`cmp-bkd-n ${s.wB > s.wA ? 'c-b-txt' : s.wB < s.wA ? 'c-muted' : ''}`}>{s.wB}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Row ───────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: string; label: string;
  valA: number | null | undefined; valB: number | null | undefined;
  format?: 'number' | 'time'; higherWins?: boolean;
}
function StatRow({ icon, label, valA, valB, format = 'number', higherWins = true }: StatRowProps) {
  const a = valA ?? 0, b = valB ?? 0;
  const aW = higherWins ? a > b : a < b;
  const bW = higherWins ? b > a : b < a;
  const diff = Math.abs(a - b);
  const delta = diff === 0 ? '' : format === 'time' ? fmtHours(diff) : diff.toLocaleString('pt-BR');
  function fmt(v: number | null | undefined) {
    if (v == null) return '—';
    return format === 'time' ? fmtHours(v) : v.toLocaleString('pt-BR');
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

// ── EXT_STATS ──────────────────────────────────────────────────────────────

const EXT_STATS = [
  { key: 'kills',               icon: 'ti-skull',          label: 'Zumbis' },
  { key: 'animals_killed',      icon: 'ti-paw',            label: 'Animais mortos' },
  { key: 'fish_caught',         icon: 'ti-fish',           label: 'Peixes pescados' },
  { key: 'crops_harvested',     icon: 'ti-seeding',        label: 'Colheitas' },
  { key: 'crops_planted',       icon: 'ti-plant',          label: 'Plantados' },
  { key: 'meals_cooked',        icon: 'ti-chef-hat',       label: 'Refeições cozinhadas' },
  { key: 'items_crafted',       icon: 'ti-tools',          label: 'Itens fabricados' },
  { key: 'materials_crafted',   icon: 'ti-hammer',         label: 'Materiais fabricados' },
  { key: 'structures_built',    icon: 'ti-building',       label: 'Estruturas construídas' },
  { key: 'stone_structures',    icon: 'ti-wall',           label: 'Estruturas de pedra' },
  { key: 'ceramic_items',       icon: 'ti-building',       label: 'Itens de cerâmica' },
  { key: 'forged_weapons',      icon: 'ti-sword',          label: 'Armas forjadas' },
  { key: 'books_read',          icon: 'ti-book',           label: 'Livros lidos' },
  { key: 'houses_looted',       icon: 'ti-home',           label: 'Casas saqueadas' },
  { key: 'trees_cut',           icon: 'ti-trees',          label: 'Árvores cortadas' },
  { key: 'eggs_collected',      icon: 'ti-egg',            label: 'Ovos coletados' },
  { key: 'milk_produced',       icon: 'ti-droplet',        label: 'Leite produzido (L)' },
  { key: 'water_collected',     icon: 'ti-droplet',        label: 'Água coletada (L)' },
  { key: 'km_driven',           icon: 'ti-car',            label: 'Km rodados' },
  { key: 'cities_visited',      icon: 'ti-map-pin',        label: 'Cidades visitadas' },
  { key: 'military_visited',    icon: 'ti-shield',         label: 'Bases militares' },
  { key: 'animal_tracks',       icon: 'ti-paw-filled',     label: 'Rastros encontrados' },
  { key: 'spiffo_visited',      icon: 'ti-building-store', label: "Restaurantes Spiffo's" },
  { key: 'hours_without_sleep', icon: 'ti-moon',           label: 'Horas sem dormir' },
] as const;

// ── Main ───────────────────────────────────────────────────────────────────

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('geral');
  const [copied, setCopied] = useState(false);

  const playerList = useMemo(() => dedup(allEntries), [allEntries]);
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

  const { winsA, winsB, breakdown } = useMemo(() => {
    if (!entryA || !entryB) return { winsA: 0, winsB: 0, breakdown: [] as SectionWin[] };
    let mA = 0, mB = 0;
    for (const f of ['score', 'days', 'kills', 'time_raw'] as const) {
      const a = (entryA[f] as number | null) ?? 0, b = (entryB[f] as number | null) ?? 0;
      if (a > b) mA++; else if (b > a) mB++;
    }
    let eA = 0, eB = 0;
    for (const s of EXT_STATS) {
      const a = (entryA[s.key as keyof Entry] as number | null) ?? 0;
      const b = (entryB[s.key as keyof Entry] as number | null) ?? 0;
      if (a > b) eA++; else if (b > a) eB++;
    }
    const cats = SKILL_CATEGORIES.map(cat => {
      let cA = 0, cB = 0;
      for (const sk of cat.skills) {
        const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
        if (a > b) cA++; else if (b > a) cB++;
      }
      return { label: cat.label, icon: 'ti-sparkles', wA: cA, wB: cB };
    });
    const sA = cats.reduce((s, c) => s + c.wA, 0);
    const sB = cats.reduce((s, c) => s + c.wB, 0);
    return {
      winsA: mA + eA + sA, winsB: mB + eB + sB,
      breakdown: [
        { label: 'Stats principais', icon: 'ti-chart-bar', wA: mA, wB: mB },
        { label: 'Atividades',       icon: 'ti-list-details', wA: eA, wB: eB },
        ...cats,
      ],
    };
  }, [entryA, entryB, skillsA, skillsB]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const both = !!(entryA && entryB);

  return (
    <div className="cmp-page">
      <header className="cmp-header">
        <Link to="/" className="cmp-back"><i className="ti ti-arrow-left" /> Início</Link>
        <h1><i className="ti ti-arrows-diff" /> Comparar Jogadores</h1>
      </header>

      <div className="cmp-selectors">
        <PlayerPicker label="Jogador A" side="a" value={entryA} entries={playerList} exclude={entryB?.player_id ?? null} onChange={setA} />
        <div className="cmp-vs-badge">VS</div>
        <PlayerPicker label="Jogador B" side="b" value={entryB} entries={playerList} exclude={entryA?.player_id ?? null} onChange={setB} />
      </div>

      {loading && <div className="cmp-empty"><i className="ti ti-loader-2" /><span>Carregando jogadores...</span></div>}
      {!loading && !both && <div className="cmp-empty"><i className="ti ti-users" /><span>Escolha dois jogadores para comparar</span></div>}

      {both && (
        <>
          <div className="cmp-hero">
            <HeroCard entry={entryA!} side="a" />
            <div className="cmp-hero-mid">
              <div className="cmp-vs-big">VS</div>
              <button className={`cmp-share${copied ? ' ok' : ''}`} onClick={copyUrl}>
                <i className={`ti ${copied ? 'ti-check' : 'ti-link'}`} />
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
            <HeroCard entry={entryB!} side="b" />
          </div>

          <nav className="cmp-tabs">
            <button className={tab === 'geral' ? 'active' : ''} onClick={() => setTab('geral')}>
              <i className="ti ti-chart-bar" /> Geral
            </button>
            <button className={tab === 'atividades' ? 'active' : ''} onClick={() => setTab('atividades')}>
              <i className="ti ti-list-details" /> Atividades
            </button>
            <button className={tab === 'habilidades' ? 'active' : ''} onClick={() => setTab('habilidades')}>
              <i className="ti ti-sparkles" /> Habilidades
            </button>
          </nav>

          <div className="cmp-body">
            {tab === 'geral' && (
              <>
                <Scoreboard winsA={winsA} winsB={winsB} nameA={entryA!.name} nameB={entryB!.name} breakdown={breakdown} />
                <div className="cmp-card">
                  <div className="cmp-card-title"><i className="ti ti-chart-bar" /> Stats Principais</div>
                  <StatRow icon="ti-trophy"   label="Score"             valA={entryA!.score}    valB={entryB!.score} />
                  <StatRow icon="ti-calendar" label="Dias sobrevividos" valA={entryA!.days}     valB={entryB!.days} />
                  <StatRow icon="ti-skull"    label="Zumbis mortos"     valA={entryA!.kills}    valB={entryB!.kills} />
                  <StatRow icon="ti-clock"    label="Tempo em jogo"     valA={entryA!.time_raw} valB={entryB!.time_raw} format="time" />
                </div>
              </>
            )}

            {tab === 'atividades' && (() => {
              const visible = EXT_STATS.filter(s => {
                const a = (entryA![s.key as keyof Entry] as number | null) ?? 0;
                const b = (entryB![s.key as keyof Entry] as number | null) ?? 0;
                return a > 0 || b > 0;
              });
              if (!visible.length) return (
                <div className="cmp-empty-tab">
                  <i className="ti ti-list-details" />
                  <span>Nenhuma atividade registrada para esses jogadores.</span>
                </div>
              );
              return (
                <div className="cmp-card">
                  <div className="cmp-card-title"><i className="ti ti-list-details" /> Atividades</div>
                  {visible.map(s => (
                    <StatRow key={s.key} icon={s.icon} label={s.label}
                      valA={entryA![s.key as keyof Entry] as number | null}
                      valB={entryB![s.key as keyof Entry] as number | null}
                    />
                  ))}
                </div>
              );
            })()}

            {tab === 'habilidades' && SKILL_CATEGORIES.map(cat => {
              let catA = 0, catB = 0;
              for (const sk of cat.skills) {
                const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
                if (a > b) catA++; else if (b > a) catB++;
              }
              const hasAny = cat.skills.some(sk => (skillsA.get(sk.name) ?? 0) + (skillsB.get(sk.name) ?? 0) > 0);
              if (!hasAny) return null;
              return (
                <div key={cat.label} className="cmp-card">
                  <div className="cmp-card-title cmp-cat-hdr">
                    <span><i className="ti ti-sparkles" /> {cat.label}</span>
                    <span className="cmp-cat-score">
                      <b className={catA > catB ? 'c-a-txt' : ''}>{catA}</b>
                      <span className="cmp-cat-sep">·</span>
                      <b className={catB > catA ? 'c-b-txt' : ''}>{catB}</b>
                    </span>
                  </div>
                  {cat.skills.map(sk => {
                    const a = skillsA.get(sk.name) ?? 0, b = skillsB.get(sk.name) ?? 0;
                    if (a === 0 && b === 0) return null;
                    const aW = a > b, bW = b > a;
                    return (
                      <div key={sk.id} className="cmp-row cmp-sk-row">
                        <div className="cmp-row-a">
                          <span className={`cmp-rval ${aW ? 'win-a' : bW ? 'lose' : 'tie'}`}>{a}</span>
                          <div className="cmp-bar-wrap">
                            <div className={`cmp-bar bar-a${!aW && bW ? ' dim' : ''}`} style={{ width: `${pct(a,b)}%`, minWidth: a > 0 ? '4px' : '0' }} />
                          </div>
                        </div>
                        <div className="cmp-row-lbl cmp-sk-name">{sk.name}</div>
                        <div className="cmp-row-b">
                          <span className={`cmp-rval ${bW ? 'win-b' : aW ? 'lose' : 'tie'}`}>{b}</span>
                          <div className="cmp-bar-wrap">
                            <div className={`cmp-bar bar-b${!bW && aW ? ' dim' : ''}`} style={{ width: `${pct(b,a)}%`, minWidth: b > 0 ? '4px' : '0' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
