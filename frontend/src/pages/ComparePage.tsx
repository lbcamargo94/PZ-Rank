import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiGetAllEntries } from '../lib/api';
import { parseSkillMap, SKILL_CATEGORIES } from '../lib/skills';
import type { Entry } from '../types';
import './compare.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtScore(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtHours(raw: number): string {
  const h = Math.floor(raw / 3600);
  const m = Math.floor((raw % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function pct(a: number, b: number): number {
  const max = Math.max(a, b);
  if (max === 0) return 0;
  return Math.round((a / max) * 100);
}

// Dedup entries by player_id, keeping the one with the highest score
function dedup(entries: Entry[]): Entry[] {
  const map = new Map<number, Entry>();
  for (const e of entries) {
    if (e.player_id == null) continue;
    const existing = map.get(e.player_id);
    if (!existing || e.score > existing.score) map.set(e.player_id, e);
  }
  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );
}

// ── Player picker combobox ────────────────────────────────────────────────────

interface PickerProps {
  label: string;
  value: Entry | null;
  entries: Entry[];
  exclude: number | null;
  onChange: (e: Entry | null) => void;
}

function PlayerPicker({ label, value, entries, exclude, onChange }: PickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(ev: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter(e => e.player_id !== exclude && (!q || e.name.toLowerCase().includes(q)))
      .slice(0, 10);
  }, [entries, query, exclude]);

  const displayValue = value ? value.name : '';

  return (
    <div>
      <div className="cmp-picker-label">{label}</div>
      <div className="cmp-picker-wrap" ref={wrapRef}>
        <input
          className="cmp-picker-input"
          placeholder="Buscar jogador..."
          value={open ? query : displayValue}
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
              <li
                key={e.player_id}
                onMouseDown={() => { onChange(e); setOpen(false); setQuery(''); }}
              >
                <span>{e.name}</span>
                <span className="cmp-entry-days">
                  {e.is_alive ? '🟢' : '💀'} {e.days}d · {fmtScore(e.score)}pts
                </span>
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

// ── Stat row ──────────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: string;
  label: string;
  valA: number | null | undefined;
  valB: number | null | undefined;
  format?: 'number' | 'time' | 'score';
  higherWins?: boolean;
}

function StatRow({ icon, label, valA, valB, format = 'number', higherWins = true }: StatRowProps) {
  const a = valA ?? 0;
  const b = valB ?? 0;
  const aWins = higherWins ? a > b : a < b;
  const bWins = higherWins ? b > a : b < a;
  const barA = pct(a, b);
  const barB = pct(b, a);

  function display(v: number | null | undefined) {
    if (v == null) return '—';
    if (format === 'time') return fmtHours(v);
    return v.toLocaleString('pt-BR');
  }

  const clsA = aWins ? 'winner' : bWins ? 'loser' : '';
  const clsB = bWins ? 'winner' : aWins ? 'loser' : '';

  return (
    <div className="cmp-stat-row">
      {/* Side A */}
      <div className="cmp-stat-a">
        <span className={`cmp-val ${clsA}`}>{display(valA)}</span>
        <div className="cmp-bar-wrap" style={{ width: '100%' }}>
          <div className={`cmp-bar-fill ${aWins ? '' : 'loser'}`} style={{ width: `${barA}%` }} />
        </div>
      </div>

      {/* Center label */}
      <div className="cmp-stat-label">
        <i className={`ti ${icon} cmp-stat-label-icon`} />
        <span className="cmp-stat-label-text">{label}</span>
      </div>

      {/* Side B */}
      <div className="cmp-stat-b">
        <span className={`cmp-val ${clsB}`}>{display(valB)}</span>
        <div className="cmp-bar-wrap" style={{ width: '100%' }}>
          <div className={`cmp-bar-fill ${bWins ? '' : 'loser'}`} style={{ width: `${barB}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const EXT_STATS = [
  { key: 'kills',            icon: 'ti-skull',       label: 'Zumbis' },
  { key: 'animals_killed',   icon: 'ti-paw',         label: 'Animais mortos' },
  { key: 'fish_caught',      icon: 'ti-fish',        label: 'Peixes pescados' },
  { key: 'crops_harvested',  icon: 'ti-seeding',     label: 'Colheitas' },
  { key: 'crops_planted',    icon: 'ti-plant',       label: 'Plantados' },
  { key: 'meals_cooked',     icon: 'ti-chef-hat',    label: 'Refeições cozinhadas' },
  { key: 'items_crafted',    icon: 'ti-tools',       label: 'Itens fabricados' },
  { key: 'materials_crafted',icon: 'ti-hammer',      label: 'Materiais fabricados' },
  { key: 'structures_built', icon: 'ti-building',    label: 'Estruturas construídas' },
  { key: 'stone_structures', icon: 'ti-wall',        label: 'Estruturas de pedra' },
  { key: 'ceramic_items',    icon: 'ti-building',    label: 'Itens de cerâmica' },
  { key: 'forged_weapons',   icon: 'ti-sword',       label: 'Armas forjadas' },
  { key: 'books_read',       icon: 'ti-book',        label: 'Livros lidos' },
  { key: 'houses_looted',    icon: 'ti-home',        label: 'Casas saqueadas' },
  { key: 'trees_cut',        icon: 'ti-trees',       label: 'Árvores cortadas' },
  { key: 'eggs_collected',   icon: 'ti-egg',         label: 'Ovos coletados' },
  { key: 'milk_produced',    icon: 'ti-droplet',     label: 'Leite produzido (L)' },
  { key: 'water_collected',  icon: 'ti-droplet',     label: 'Água coletada (L)' },
  { key: 'km_driven',        icon: 'ti-car',         label: 'Km rodados' },
  { key: 'cities_visited',   icon: 'ti-map-pin',     label: 'Cidades visitadas' },
  { key: 'military_visited', icon: 'ti-shield',      label: 'Bases militares' },
  { key: 'animal_tracks',    icon: 'ti-paw-filled',  label: 'Rastros encontrados' },
  { key: 'spiffo_visited',   icon: 'ti-building-store', label: 'Restaurantes Spiffo\'s' },
  { key: 'hours_without_sleep', icon: 'ti-moon',     label: 'Horas sem dormir' },
] as const;

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const playerList = useMemo(() => dedup(allEntries), [allEntries]);

  const pidA = searchParams.get('a') ? Number(searchParams.get('a')) : null;
  const pidB = searchParams.get('b') ? Number(searchParams.get('b')) : null;

  const entryA = useMemo(() => playerList.find(e => e.player_id === pidA) ?? null, [playerList, pidA]);
  const entryB = useMemo(() => playerList.find(e => e.player_id === pidB) ?? null, [playerList, pidB]);

  useEffect(() => {
    apiGetAllEntries('score')
      .then(setAllEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setA = useCallback((e: Entry | null) => {
    setSearchParams(p => {
      const next = new URLSearchParams(p);
      if (e?.player_id != null) next.set('a', String(e.player_id));
      else next.delete('a');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setB = useCallback((e: Entry | null) => {
    setSearchParams(p => {
      const next = new URLSearchParams(p);
      if (e?.player_id != null) next.set('b', String(e.player_id));
      else next.delete('b');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ── Skill comparison ────────────────────────
  const skillsA = useMemo(() => parseSkillMap(entryA?.skills ?? null), [entryA]);
  const skillsB = useMemo(() => parseSkillMap(entryB?.skills ?? null), [entryB]);

  // Count wins per player across ALL stats + skills
  const { winsA, winsB } = useMemo(() => {
    if (!entryA || !entryB) return { winsA: 0, winsB: 0 };
    let wA = 0, wB = 0;
    const fields: (keyof Entry)[] = [
      'score', 'days', 'kills', 'time_raw',
      'animals_killed', 'fish_caught', 'crops_harvested', 'crops_planted',
      'meals_cooked', 'items_crafted', 'materials_crafted', 'structures_built',
      'stone_structures', 'ceramic_items', 'forged_weapons', 'books_read',
      'houses_looted', 'trees_cut', 'eggs_collected', 'milk_produced',
      'water_collected', 'km_driven', 'cities_visited', 'military_visited',
      'animal_tracks', 'spiffo_visited', 'hours_without_sleep',
    ];
    for (const f of fields) {
      const a = (entryA[f] as number | null) ?? 0;
      const b = (entryB[f] as number | null) ?? 0;
      if (a > b) wA++;
      else if (b > a) wB++;
    }
    // Skills
    for (const cat of SKILL_CATEGORIES) {
      for (const skill of cat.skills) {
        const a = skillsA.get(skill.name) ?? 0;
        const b = skillsB.get(skill.name) ?? 0;
        if (a > b) wA++;
        else if (b > a) wB++;
      }
    }
    return { winsA: wA, winsB: wB };
  }, [entryA, entryB, skillsA, skillsB]);

  const bothSelected = entryA && entryB;

  return (
    <div className="cmp-page">
      <header className="cmp-header">
        <Link to="/" className="cmp-back">
          <i className="ti ti-arrow-left" /> Início
        </Link>
        <h1><i className="ti ti-arrows-diff" /> Comparar Jogadores</h1>
      </header>

      {/* Player selectors */}
      <div className="cmp-selectors">
        <PlayerPicker
          label="Jogador A"
          value={entryA}
          entries={playerList}
          exclude={entryB?.player_id ?? null}
          onChange={setA}
        />
        <div className="cmp-vs-badge">VS</div>
        <PlayerPicker
          label="Jogador B"
          value={entryB}
          entries={playerList}
          exclude={entryA?.player_id ?? null}
          onChange={setB}
        />
      </div>

      {loading && (
        <div className="cmp-empty">
          <i className="ti ti-loader-2" />
          <span>Carregando jogadores...</span>
        </div>
      )}

      {!loading && !bothSelected && (
        <div className="cmp-empty">
          <i className="ti ti-users" />
          <span>Escolha dois jogadores para comparar</span>
        </div>
      )}

      {bothSelected && (
        <div className="cmp-body">
          {/* ── Heads-up display ── */}
          <div className="cmp-heads">
            <div className="cmp-head cmp-head-a">
              <div className="cmp-head-nick">{entryA.name}</div>
              {entryA.character_name && (
                <div className="cmp-head-char">{entryA.character_name}</div>
              )}
              <span className={`cmp-head-alive ${entryA.is_alive ? 'alive' : 'dead'}`}>
                {entryA.is_alive ? <><i className="ti ti-heartbeat" /> Vivo</> : <><i className="ti ti-skull" /> Morto</>}
              </span>
            </div>
            <div className="cmp-head-sep">VS</div>
            <div className="cmp-head cmp-head-b">
              <div className="cmp-head-nick">{entryB.name}</div>
              {entryB.character_name && (
                <div className="cmp-head-char">{entryB.character_name}</div>
              )}
              <span className={`cmp-head-alive ${entryB.is_alive ? 'alive' : 'dead'}`}>
                {entryB.is_alive ? <><i className="ti ti-heartbeat" /> Vivo</> : <><i className="ti ti-skull" /> Morto</>}
              </span>
            </div>
          </div>

          {/* ── Placar geral ── */}
          <div className="cmp-card">
            <div className="cmp-card-title"><i className="ti ti-trophy" /> Placar geral</div>
            <div className="cmp-score-tiles">
              <div className={`cmp-score-tile ${winsA > winsB ? 'winner-tile' : ''}`}>
                <div className="cmp-tile-nick">{entryA.name}</div>
                <div className="cmp-tile-wins">{winsA}</div>
                <div className="cmp-tile-label">categorias vencidas</div>
              </div>
              <div className={`cmp-score-tile ${winsB > winsA ? 'winner-tile' : ''}`}>
                <div className="cmp-tile-nick">{entryB.name}</div>
                <div className="cmp-tile-wins">{winsB}</div>
                <div className="cmp-tile-label">categorias vencidas</div>
              </div>
            </div>
          </div>

          {/* ── Stats principais ── */}
          <div className="cmp-card">
            <div className="cmp-card-title"><i className="ti ti-chart-bar" /> Stats principais</div>
            <StatRow icon="ti-trophy"   label="Score"             valA={entryA.score}    valB={entryB.score}    format="score" />
            <StatRow icon="ti-calendar" label="Dias sobrevividos" valA={entryA.days}     valB={entryB.days} />
            <StatRow icon="ti-skull"    label="Zumbis mortos"     valA={entryA.kills}    valB={entryB.kills} />
            <StatRow icon="ti-clock"    label="Tempo em jogo"     valA={entryA.time_raw} valB={entryB.time_raw} format="time" />
          </div>

          {/* ── Stats estendidos ── */}
          {(() => {
            const rows = EXT_STATS.filter(s => {
              const a = (entryA[s.key as keyof Entry] as number | null) ?? 0;
              const b = (entryB[s.key as keyof Entry] as number | null) ?? 0;
              return a > 0 || b > 0;
            });
            if (rows.length === 0) return null;
            return (
              <div className="cmp-card">
                <div className="cmp-card-title"><i className="ti ti-list-details" /> Atividades</div>
                {rows.map(s => (
                  <StatRow
                    key={s.key}
                    icon={s.icon}
                    label={s.label}
                    valA={(entryA[s.key as keyof Entry] as number | null)}
                    valB={(entryB[s.key as keyof Entry] as number | null)}
                  />
                ))}
              </div>
            );
          })()}

          {/* ── Skills por categoria ── */}
          {SKILL_CATEGORIES.map(cat => (
            <div key={cat.label} className="cmp-card">
              <div className="cmp-card-title">
                <i className="ti ti-sparkles" /> Habilidades — {cat.label}
              </div>
              {cat.skills.map(skill => {
                const a = skillsA.get(skill.name) ?? 0;
                const b = skillsB.get(skill.name) ?? 0;
                const barA = pct(a, b);
                const barB = pct(b, a);
                const clsA = a > b ? 'winner' : a < b ? 'loser' : 'tied';
                const clsB = b > a ? 'winner' : b < a ? 'loser' : 'tied';
                return (
                  <div key={skill.id} className="cmp-skill-row">
                    {/* Side A */}
                    <div className="cmp-skill-a">
                      <div className={`cmp-skill-val ${clsA}`}>{a}</div>
                      <div className="cmp-skill-bar-a">
                        <div
                          className={`cmp-skill-bar-fill ${a >= b ? '' : 'loser'}`}
                          style={{ width: `${barA}%`, maxWidth: '100%', minWidth: a > 0 ? '4px' : '0' }}
                        />
                      </div>
                    </div>

                    {/* Center label */}
                    <div className="cmp-skill-name">{skill.name}</div>

                    {/* Side B */}
                    <div className="cmp-skill-b">
                      <div className={`cmp-skill-val ${clsB}`}>{b}</div>
                      <div className="cmp-skill-bar-b">
                        <div
                          className={`cmp-skill-bar-fill ${b >= a ? '' : 'loser'}`}
                          style={{ width: `${barB}%`, maxWidth: '100%', minWidth: b > 0 ? '4px' : '0' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* ── Link compartilhável ── */}
          <div style={{ textAlign: 'center', color: 'var(--text-4)', fontSize: '.8rem' }}>
            <i className="ti ti-link" /> Link desta comparação:&nbsp;
            <button
              style={{ background: 'none', border: 'none', color: 'var(--green-light)', cursor: 'pointer', font: 'inherit' }}
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              copiar URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
