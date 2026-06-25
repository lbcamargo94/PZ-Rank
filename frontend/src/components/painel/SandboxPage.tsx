import { useState, useMemo } from 'react';
import { SANDBOX_RULES, validateSandbox, getNestedValue } from '../../lib/sandboxRules';
import type { Entry } from '../../types';
import type { RuleResult } from '../../lib/sandboxRules';

interface Props {
  entry: Entry;
  onBack: () => void;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear() + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number')
    return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, '');
  return String(v);
}

function ruleOk(rule: (typeof SANDBOX_RULES)[0], actual: unknown): boolean {
  if (typeof rule.expected === 'boolean') return actual === rule.expected;
  if (typeof rule.expected === 'number' && typeof actual === 'number')
    return Math.abs(actual - rule.expected) <= (rule.tol ?? 0.01);
  return actual === rule.expected;
}

// ── Agrupamento por categoria ──────────────────────────────────────────────

const LOOT_KEYS  = [
  'FoodLootNew','CannedFoodLootNew','WeaponLootNew','RangedWeaponLootNew',
  'AmmoLootNew','MedicalLootNew','SurvivalGearsLootNew','ClothingLootNew',
  'MechanicsLootNew','ToolLootNew','MaterialLootNew','CookwareLootNew',
  'FarmingLootNew','SkillBookLoot','LiteratureLootNew','RecipeResourceLoot',
  'MediaLootNew','MementoLootNew','ContainerLootNew','KeyLootNew','OtherLootNew',
  'GeneratorSpawning',
];
const MUNDO_KEYS = ['WaterShut','ElecShut','Alarm'];
const NAT_KEYS   = ['NightDarkness','Temperature','Rain','FishAbundance','NatureAbundance'];
const VEI_KEYS   = ['ChanceHasGas','InitialGas','LockedCar','CarGeneralCondition'];

function getGroup(key: string): string {
  if (key.startsWith('ZombieConfig.'))    return 'Zumbis — População';
  if (key.startsWith('ZombieLore.'))      return 'Zumbis — Comportamento';
  if (LOOT_KEYS.includes(key))            return 'Loot';
  if (MUNDO_KEYS.includes(key))           return 'Mundo';
  if (NAT_KEYS.includes(key))             return 'Natureza';
  if (key === 'MetaEvent' || key.startsWith('Map.')) return 'Ambiente';
  if (key.startsWith('MultiplierConfig.')) return 'Personagem';
  if (VEI_KEYS.includes(key))            return 'Veículos';
  if (key === 'AnimalRanchChance')        return 'Animais';
  return 'Geral';
}

const GROUP_ORDER = [
  'Zumbis — População',
  'Zumbis — Comportamento',
  'Loot',
  'Mundo',
  'Natureza',
  'Ambiente',
  'Personagem',
  'Veículos',
  'Animais',
  'Geral',
];

const GROUP_ICONS: Record<string, string> = {
  'Zumbis — População':    'ti-users',
  'Zumbis — Comportamento':'ti-brain',
  'Loot':                  'ti-package',
  'Mundo':                 'ti-world',
  'Natureza':              'ti-leaf',
  'Ambiente':              'ti-map-2',
  'Personagem':            'ti-user',
  'Veículos':              'ti-car',
  'Animais':               'ti-paw',
  'Geral':                 'ti-adjustments',
};

// ── Aba Validação ──────────────────────────────────────────────────────────

type Filter = 'all' | 'fail' | 'ok';

function ValidationTab({ sandboxData, sandboxOk }: {
  sandboxData: Record<string, unknown>;
  sandboxOk: boolean | null;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const results = useMemo(() => validateSandbox(sandboxData), [sandboxData]);

  const passed  = results.filter(r => r.ok).length;
  const failed  = results.filter(r => !r.ok && !r.missing).length;
  const missing = results.filter(r => r.missing).length;
  const allOk   = failed === 0 && missing === 0;

  const grouped = useMemo(() => {
    const map = new Map<string, RuleResult[]>();
    for (const r of results) {
      const g = getGroup(r.rule.key);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(r);
    }
    return GROUP_ORDER
      .filter(g => map.has(g))
      .map(g => ({ name: g, icon: GROUP_ICONS[g] ?? 'ti-dots', items: map.get(g)! }));
  }, [results]);

  return (
    <div className="painel-main">
      {/* Verdict banner */}
      <div className={`sbxp-verdict ${allOk ? 'sbxp-verdict-ok' : 'sbxp-verdict-fail'}`}>
        <i className={`ti ${allOk ? 'ti-shield-check' : 'ti-shield-exclamation'} sbxp-verdict-icon`} />
        <div className="sbxp-verdict-body">
          <strong className="sbxp-verdict-title">
            {allOk
              ? 'Configuração válida — Brasileirão OK'
              : `${failed + missing} violaç${failed + missing === 1 ? 'ão' : 'ões'} encontrada${failed + missing === 1 ? '' : 's'}`}
          </strong>
          <span className="sbxp-verdict-sub">
            {allOk
              ? `Todas as ${passed} regras do desafio estão corretas.`
              : `${failed} inválid${failed === 1 ? 'o' : 'os'} · ${missing} ausente${missing === 1 ? '' : 's'} · ${passed} correto${passed === 1 ? '' : 's'}`}
          </span>
        </div>
        {sandboxOk !== null && (
          <span className={`rank-tab-badge ${sandboxOk ? 'sbxp-badge-ok' : 'sbxp-badge-fail'}`}>
            sandbox_ok: {sandboxOk ? 'true ✓' : 'false ✗'}
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="sbxp-filter-row">
        {([
          { key: 'all'  as Filter, label: 'Todos',  n: results.length },
          { key: 'fail' as Filter, label: 'Falhas', n: failed + missing },
          { key: 'ok'   as Filter, label: 'OK',     n: passed },
        ] as { key: Filter; label: string; n: number }[]).map(f => (
          <button
            key={f.key}
            className={`sort-btn${filter === f.key ? ' active' : ''}${f.key === 'fail' ? ' sbxp-btn-fail' : f.key === 'ok' ? ' sbxp-btn-ok' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="rank-tab-badge">{f.n}</span>
          </button>
        ))}
      </div>

      {/* Grupos */}
      {grouped.map(({ name, icon, items }) => {
        const visible = filter === 'fail' ? items.filter(r => !r.ok)
                      : filter === 'ok'   ? items.filter(r => r.ok)
                      : items;
        if (visible.length === 0) return null;

        const groupFails = items.filter(r => !r.ok).length;
        const groupOk    = items.filter(r => r.ok).length;

        return (
          <div key={name} className="painel-section">
            <div className="painel-section-header">
              <h2><i className={`ti ${icon}`} /> {name}</h2>
              <div className="sbxp-group-stats">
                {groupFails > 0 && (
                  <span className="rank-tab-badge sbxp-badge-fail">
                    <i className="ti ti-x" /> {groupFails}
                  </span>
                )}
                <span className="rank-tab-badge sbxp-badge-ok">
                  <i className="ti ti-check" /> {groupOk}/{items.length}
                </span>
              </div>
            </div>

            <div className="sbxp-rules-grid">
              {visible.map(r => (
                <div key={r.rule.key}
                  className={`sbxp-rule${r.ok ? ' sbxp-rule-ok' : r.missing ? ' sbxp-rule-miss' : ' sbxp-rule-fail'}`}>
                  <div className="sbxp-rule-icon">
                    {r.ok ? <i className="ti ti-check" />
                           : r.missing ? <i className="ti ti-question-mark" />
                           : <i className="ti ti-x" />}
                  </div>
                  <div className="sbxp-rule-content">
                    <span className="sbxp-rule-label">{r.rule.label}</span>
                    <div className="sbxp-rule-values">
                      {r.missing
                        ? <span className="sbxp-miss-val">ausente</span>
                        : r.ok
                          ? <span className="sbxp-ok-val">{fmtValue(r.actual)}</span>
                          : <span className="sbxp-fail-val">{fmtValue(r.actual)}</span>}
                      {!r.ok && !r.missing && (
                        <span className="sbxp-expected">→ {fmtValue(r.rule.expected)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Aba Configurações ──────────────────────────────────────────────────────

function ConfigTab({ sandboxData }: { sandboxData: Record<string, unknown> }) {
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats: { name: string; data: Record<string, unknown>; fails: number }[] = [];
    const flat: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(sandboxData)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const data = v as Record<string, unknown>;
        const fails = Object.entries(data).filter(([ck, cv]) => {
          const rule = SANDBOX_RULES.find(r => r.key === k + '.' + ck);
          return rule ? !ruleOk(rule, cv) : false;
        }).length;
        cats.push({ name: k, data, fails });
      } else {
        flat[k] = v;
      }
    }
    if (Object.keys(flat).length > 0)
      cats.unshift({ name: 'Geral', data: flat, fails: 0 });

    return cats.sort((a, b) => {
      if (b.fails !== a.fails) return b.fails - a.fails;
      if (a.name === 'Geral') return 1;
      if (b.name === 'Geral') return -1;
      return a.name.localeCompare(b.name);
    });
  }, [sandboxData]);

  const current = activeCategory ?? categories[0]?.name ?? null;
  const catData = categories.find(c => c.name === current);
  const searchLow = search.toLowerCase();

  // Busca global — flat sobre todas as categorias
  const searchResults = useMemo(() => {
    if (!searchLow) return null;
    const rows: { cat: string; key: string; value: unknown; rule?: (typeof SANDBOX_RULES)[0]; ok?: boolean }[] = [];
    for (const cat of categories) {
      for (const [k, v] of Object.entries(cat.data)) {
        if (typeof v === 'object' && v !== null) continue;
        if (!k.toLowerCase().includes(searchLow) && !String(v).toLowerCase().includes(searchLow)) continue;
        const ruleKey = cat.name === 'Geral' ? k : cat.name + '.' + k;
        const rule    = SANDBOX_RULES.find(r => r.key === ruleKey);
        const ok      = rule ? ruleOk(rule, v) : undefined;
        rows.push({ cat: cat.name, key: k, value: v, rule, ok });
      }
    }
    return rows;
  }, [searchLow, categories]);

  // Linhas da categoria atual; para "Geral", agrupa por categoria lógica
  const displayRows = useMemo(() => {
    if (searchResults || !catData) return null;
    return Object.entries(catData.data)
      .filter(([, v]) => typeof v !== 'object' || v === null)
      .map(([k, v]) => {
        const ruleKey = current === 'Geral' ? k : current + '.' + k;
        const rule    = SANDBOX_RULES.find(r => r.key === ruleKey);
        const ok      = rule ? ruleOk(rule, v) : undefined;
        const group   = current === 'Geral' ? getGroup(k) : null;
        return { key: k, value: v, rule, ok, group };
      })
      .sort((a, b) => {
        // Para Geral: ordenar por grupo (GROUP_ORDER) depois por key
        if (a.group && b.group) {
          const gi = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
          if (gi !== 0) return gi;
        }
        return a.key.localeCompare(b.key);
      });
  }, [catData, current, searchResults]);

  return (
    <div className="sbxp-config">
      {/* Barra de busca */}
      <div className="sbxp-search-bar">
        <i className="ti ti-search" />
        <input
          type="text"
          placeholder="Pesquisar em todas as configurações..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn-icon" onClick={() => setSearch('')}>
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      {searchResults ? (
        /* Resultados da busca */
        <div className="sbxp-config-body">
          <div className="sbxp-config-content">
            <div className="sbxp-content-header">
              <h3 className="painel-section-header" style={{ padding: 0, border: 'none', background: 'none' }}>
                <i className="ti ti-search" /> {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para &ldquo;{search}&rdquo;
              </h3>
            </div>
            <table className="sbxp-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Configuração</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((r, i) => (
                  <tr key={i} className={r.ok === false ? 'sbxp-row-fail' : r.ok === true ? 'sbxp-row-ok' : ''}>
                    <td className="sbxp-td-cat">{r.cat}</td>
                    <td className="sbxp-td-key">{r.key}</td>
                    <td className="sbxp-td-val">{fmtValue(r.value)}</td>
                    <td className="sbxp-td-status">
                      {r.rule
                        ? r.ok
                          ? <span className="sbxp-ok-val"><i className="ti ti-check" /></span>
                          : <span className="sbxp-fail-val"><i className="ti ti-x" /> {fmtValue(r.rule.expected)}</span>
                        : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Navegador de categorias */
        <div className="sbxp-config-body">
          {/* Sidebar */}
          <nav className="sbxp-sidebar">
            {categories.map(cat => (
              <button
                key={cat.name}
                className={`sbxp-cat-btn${current === cat.name ? ' active' : ''}${cat.fails > 0 ? ' has-fail' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <span className="sbxp-cat-btn-name">{cat.name}</span>
                <span className="rank-tab-badge" style={{ fontSize: '10px' }}>{Object.keys(cat.data).length}</span>
                {cat.fails > 0 && (
                  <span className="rank-tab-badge sbxp-badge-fail" style={{ fontSize: '10px' }}>
                    <i className="ti ti-x" />{cat.fails}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Conteúdo */}
          {catData && (
            <div className="sbxp-config-content">
              <div className="sbxp-content-header">
                <span className="sbxp-content-title">{current}</span>
                <span className="sbxp-content-meta">
                  {Object.keys(catData.data).length} configurações
                  {catData.fails > 0 && (
                    <span className="rank-tab-badge sbxp-badge-fail" style={{ marginLeft: '8px' }}>
                      <i className="ti ti-x" /> {catData.fails} falha{catData.fails > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>

              <table className="sbxp-table">
                <thead>
                  <tr>
                    {current === 'Geral' && <th>Grupo</th>}
                    <th>Configuração</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let lastGroup: string | null = null;
                    return displayRows!.map((r, i) => {
                      const groupChanged = r.group !== null && r.group !== lastGroup;
                      if (groupChanged) lastGroup = r.group;
                      return (
                        <>
                          {groupChanged && (
                            <tr key={`g-${r.group}-${i}`} className="sbxp-group-row">
                              <td colSpan={4}>
                                <i className={`ti ${GROUP_ICONS[r.group!] ?? 'ti-dots'}`} />
                                {' '}{r.group}
                              </td>
                            </tr>
                          )}
                          <tr key={r.key} className={r.ok === false ? 'sbxp-row-fail' : r.ok === true ? 'sbxp-row-ok' : ''}>
                            {current === 'Geral' && <td className="sbxp-td-cat">{r.group ?? '—'}</td>}
                            <td className="sbxp-td-key">{r.key}</td>
                            <td className="sbxp-td-val">{fmtValue(r.value)}</td>
                            <td className="sbxp-td-status">
                              {r.rule
                                ? r.ok
                                  ? <span className="sbxp-ok-val"><i className="ti ti-check" /></span>
                                  : <span className="sbxp-fail-val"><i className="ti ti-x" /> {fmtValue(r.rule!.expected)}</span>
                                : <span style={{ color: 'var(--text-4)' }}>—</span>}
                            </td>
                          </tr>
                        </>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SandboxPage principal ──────────────────────────────────────────────────

type PageTab = 'validate' | 'config';

export function SandboxPage({ entry, onBack }: Props) {
  const [tab, setTab] = useState<PageTab>('validate');

  const cfg = entry.sandbox_config;
  const sandboxData = (
    cfg && typeof cfg === 'object' && cfg.sandbox && typeof cfg.sandbox === 'object'
      ? cfg.sandbox
      : cfg
  ) as Record<string, unknown> | null;

  const meta = cfg as { character?: string; timestamp?: string } | null;

  const { failCount, passCount } = useMemo(() => {
    if (!sandboxData) return { failCount: 0, passCount: 0 };
    const outcomes = SANDBOX_RULES.map(r => {
      const actual = getNestedValue(sandboxData, r.key);
      if (actual == null) return false;
      return ruleOk(r, actual);
    });
    return { failCount: outcomes.filter(v => !v).length, passCount: outcomes.filter(v => v).length };
  }, [sandboxData]);

  const sandboxOk = entry.sandbox_ok ?? (cfg ? failCount === 0 : null);

  return (
    <div className="painel-wrap">
      {/* ── Header idêntico ao painel ── */}
      <header className="painel-header">
        <div className="container painel-header-inner">
          <div className="painel-header-left">
            <button className="btn-secondary btn-sm" onClick={onBack}>
              <i className="ti ti-arrow-left" /> Voltar ao Painel
            </button>
            <span className="painel-title">
              <i className="ti ti-adjustments" /> Sandbox
            </span>
            {entry.character_name && (
              <span className="painel-title" style={{ color: 'var(--text-2)' }}>
                {entry.character_name}
              </span>
            )}
            <span className="mod-email"><i className="ti ti-user" /> {entry.name}</span>
          </div>
          <div className="painel-header-right">
            {meta?.timestamp && (
              <span className="mod-email">
                <i className="ti ti-clock" /> {fmtDate(entry.sandbox_config_updated_at ?? meta.timestamp)}
              </span>
            )}
            {sandboxData
              ? failCount === 0
                ? <span className="rank-tab-badge sbxp-badge-ok">
                    <i className="ti ti-shield-check" /> {passCount}/{SANDBOX_RULES.length} OK
                  </span>
                : <span className="rank-tab-badge sbxp-badge-fail">
                    <i className="ti ti-shield-exclamation" /> {failCount} violaç{failCount === 1 ? 'ão' : 'ões'}
                  </span>
              : <span className="rank-tab-badge">Sem dados</span>}
            {sandboxOk !== null && (
              <span className={`rank-tab-badge ${sandboxOk ? 'sbxp-badge-ok' : 'sbxp-badge-fail'}`}>
                sandbox_ok: {sandboxOk ? 'true' : 'false'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Sem dados ── */}
      {!cfg && (
        <div className="painel-main">
          <div className="painel-section">
            <div className="painel-empty" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <i className="ti ti-adjustments-off" style={{ fontSize: '40px', display: 'block', marginBottom: '12px', opacity: 0.4 }} />
              Sandbox não enviado. O mod enviará automaticamente ao próximo save ou sync.
            </div>
          </div>
        </div>
      )}

      {cfg && sandboxData && (
        <>
          {/* ── Tabs ── */}
          <div className="container painel-nav">
            <div className="painel-tabs">
              <button
                className={`painel-tab${tab === 'validate' ? ' active' : ''}`}
                onClick={() => setTab('validate')}
              >
                <i className="ti ti-shield-check" /> Validação do Desafio
                {failCount > 0
                  ? <span className="rank-tab-badge sbxp-badge-fail"><i className="ti ti-x" /> {failCount}</span>
                  : <span className="rank-tab-badge sbxp-badge-ok">{passCount}/{SANDBOX_RULES.length}</span>}
              </button>
              <button
                className={`painel-tab${tab === 'config' ? ' active' : ''}`}
                onClick={() => setTab('config')}
              >
                <i className="ti ti-adjustments" /> Todas as Configurações
              </button>
            </div>
          </div>

          {/* ── Conteúdo ── */}
          <div className="container">
            {tab === 'validate' && (
              <ValidationTab sandboxData={sandboxData} sandboxOk={sandboxOk} />
            )}
            {tab === 'config' && (
              <ConfigTab sandboxData={sandboxData} />
            )}
          </div>
        </>
      )}
    </div>
  );
}