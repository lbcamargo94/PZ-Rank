import { useState, useMemo } from 'react';
import { SANDBOX_RULES, validateSandbox, getNestedValue } from '../../lib/sandboxRules';
import type { Entry } from '../../types';

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

  const sorted = useMemo(() => [
    ...results.filter(r => !r.ok && !r.missing),
    ...results.filter(r => r.missing),
    ...results.filter(r => r.ok),
  ], [results]);

  const visible = filter === 'fail' ? sorted.filter(r => !r.ok)
                : filter === 'ok'   ? sorted.filter(r => r.ok)
                : sorted;

  return (
    <div className="sbxp-validate">
      {/* Verdict */}
      <div className={`sbxp-verdict ${allOk ? 'sbxp-verdict-ok' : 'sbxp-verdict-fail'}`}>
        <i className={`ti ${allOk ? 'ti-shield-check' : 'ti-shield-exclamation'} sbxp-verdict-icon`} />
        <div className="sbxp-verdict-body">
          <strong className="sbxp-verdict-title">
            {allOk ? 'Configuração válida — Brasileirão OK' :
              `${failed + missing} violaç${failed + missing === 1 ? 'ão' : 'ões'} encontrada${failed + missing === 1 ? '' : 's'}`}
          </strong>
          <span className="sbxp-verdict-sub">
            {allOk
              ? `Todas as ${passed} regras verificadas estão corretas.`
              : `${failed} inválid${failed === 1 ? 'o' : 'os'} · ${missing} ausente${missing === 1 ? '' : 's'} · ${passed} correto${passed === 1 ? '' : 's'}`}
          </span>
        </div>
        {sandboxOk !== null && (
          <span className={`sbxp-sbxok-badge ${sandboxOk ? 'sbxp-ok' : 'sbxp-fail'}`}>
            sandbox_ok: {sandboxOk ? 'true ✓' : 'false ✗'}
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="sbxp-filters">
        {([
          { key: 'all'  as Filter, label: 'Todos',  count: results.length },
          { key: 'fail' as Filter, label: 'Falhas', count: failed + missing },
          { key: 'ok'   as Filter, label: 'OK',     count: passed },
        ] as { key: Filter; label: string; count: number }[]).map(f => (
          <button
            key={f.key}
            className={`sbxp-filter${filter === f.key ? ' active' : ''}${f.key === 'fail' ? ' sbxp-filter-danger' : f.key === 'ok' ? ' sbxp-filter-ok' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} <span className="sbxp-filter-n">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grid de regras */}
      <div className="sbxp-rules-grid">
        {visible.map(r => (
          <div key={r.rule.key}
            className={`sbxp-rule ${r.ok ? 'sbxp-rule-ok' : r.missing ? 'sbxp-rule-miss' : 'sbxp-rule-fail'}`}>
            <div className="sbxp-rule-icon">
              {r.ok ? <i className="ti ti-check" /> : r.missing ? <i className="ti ti-question-mark" /> : <i className="ti ti-x" />}
            </div>
            <div className="sbxp-rule-content">
              <span className="sbxp-rule-label">{r.rule.label}</span>
              <div className="sbxp-rule-values">
                {r.missing
                  ? <span className="sbxp-rule-actual sbxp-miss-val">ausente</span>
                  : r.ok
                    ? <span className="sbxp-rule-actual sbxp-ok-val">{fmtValue(r.actual)}</span>
                    : <span className="sbxp-rule-actual sbxp-fail-val">{fmtValue(r.actual)}</span>}
                {!r.ok && (
                  <span className="sbxp-rule-expected">esperado: {fmtValue(r.rule.expected)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Aba Configurações ──────────────────────────────────────────────────────

function ConfigTab({ sandboxData }: { sandboxData: Record<string, unknown> }) {
  const [search,      setSearch]      = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats: { name: string; data: Record<string, unknown>; fails: number }[] = [];
    const flat: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(sandboxData)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const data = v as Record<string, unknown>;
        const fails = Object.entries(data).filter(([ck, cv]) => {
          const key  = k + '.' + ck;
          const rule = SANDBOX_RULES.find(r => r.key === key);
          return rule ? !ruleOk(rule, cv) : false;
        }).length;
        cats.push({ name: k, data, fails });
      } else {
        flat[k] = v;
      }
    }
    if (Object.keys(flat).length > 0) {
      cats.unshift({ name: 'Geral', data: flat, fails: 0 });
    }
    // Sort: categories with failures first, then alphabetically
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

  // When searching, show all categories flattened
  const searchResults = useMemo(() => {
    if (!searchLow) return null;
    const rows: { cat: string; key: string; value: unknown; rule?: (typeof SANDBOX_RULES)[0]; ok?: boolean }[] = [];
    for (const cat of categories) {
      for (const [k, v] of Object.entries(cat.data)) {
        if (typeof v === 'object' && v !== null) continue;
        if (!k.toLowerCase().includes(searchLow) && !String(v).toLowerCase().includes(searchLow)) continue;
        const ruleKey = cat.name + '.' + k;
        const rule    = SANDBOX_RULES.find(r => r.key === ruleKey || r.key === k);
        const ok      = rule ? ruleOk(rule, v) : undefined;
        rows.push({ cat: cat.name, key: k, value: v, rule, ok });
      }
    }
    return rows;
  }, [searchLow, categories]);

  const displayRows = useMemo(() => {
    if (searchResults) return null;
    if (!catData) return [];
    return Object.entries(catData.data)
      .filter(([, v]) => typeof v !== 'object' || v === null)
      .map(([k, v]) => {
        const ruleKey = current + '.' + k;
        const rule    = SANDBOX_RULES.find(r => r.key === ruleKey || r.key === k);
        const ok      = rule ? ruleOk(rule, v) : undefined;
        return { key: k, value: v, rule, ok };
      });
  }, [catData, current, searchResults]);

  return (
    <div className="sbxp-config">
      {/* Search */}
      <div className="sbxp-config-search">
        <i className="ti ti-search" />
        <input
          type="text"
          placeholder="Pesquisar em todas as configurações..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')}><i className="ti ti-x" /></button>
        )}
      </div>

      {searchResults ? (
        /* Search results — all categories flattened */
        <div className="sbxp-search-results">
          <p className="sbxp-search-count">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para &quot;{search}&quot;</p>
          <table className="sbxp-table">
            <thead>
              <tr><th>Categoria</th><th>Configuração</th><th>Valor</th><th>Status</th></tr>
            </thead>
            <tbody>
              {searchResults.map((r, i) => (
                <tr key={i} className={r.ok === false ? 'row-fail' : r.ok === true ? 'row-ok' : ''}>
                  <td className="sbxp-td-cat">{r.cat}</td>
                  <td className="sbxp-td-key">{r.key}</td>
                  <td className="sbxp-td-val">{fmtValue(r.value)}</td>
                  <td className="sbxp-td-status">
                    {r.rule
                      ? r.ok
                        ? <span className="sbxp-ok"><i className="ti ti-check" /></span>
                        : <span className="sbxp-fail"><i className="ti ti-x" /> {fmtValue(r.rule.expected)}</span>
                      : <span className="sbxp-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Category browser */
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
                <span className="sbxp-cat-btn-count">{Object.keys(cat.data).length}</span>
                {cat.fails > 0 && (
                  <span className="sbxp-cat-btn-fail"><i className="ti ti-x" />{cat.fails}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Table */}
          <div className="sbxp-config-content">
            {catData && (
              <>
                <div className="sbxp-content-header">
                  <h3>{current}</h3>
                  <span className="sbxp-content-count">{Object.keys(catData.data).length} configurações</span>
                  {catData.fails > 0 && (
                    <span className="sbxp-content-fail"><i className="ti ti-x" /> {catData.fails} falha{catData.fails > 1 ? 's' : ''}</span>
                  )}
                </div>
                <table className="sbxp-table">
                  <thead>
                    <tr><th>Configuração</th><th>Valor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {displayRows!.map(r => (
                      <tr key={r.key} className={r.ok === false ? 'row-fail' : r.ok === true ? 'row-ok' : ''}>
                        <td className="sbxp-td-key">{r.key}</td>
                        <td className="sbxp-td-val">{fmtValue(r.value)}</td>
                        <td className="sbxp-td-status">
                          {r.rule
                            ? r.ok
                              ? <span className="sbxp-ok"><i className="ti ti-check" /></span>
                              : <span className="sbxp-fail"><i className="ti ti-x" /> esperado: {fmtValue(r.rule!.expected)}</span>
                            : <span className="sbxp-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SandboxPage principal ──────────────────────────────────────────────────

type PageTab = 'validate' | 'config';

export function SandboxPage({ entry, onBack }: Props) {
  const [tab, setTab] = useState<PageTab>('validate');

  const cfg        = entry.sandbox_config;
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
    <div className="sbxp-wrap">
      {/* ── Header ── */}
      <div className={`sbxp-header ${sandboxData ? (failCount === 0 ? 'sbxp-header-ok' : 'sbxp-header-fail') : ''}`}>
        <button className="sbxp-back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" /> Voltar ao Painel
        </button>

        <div className="sbxp-header-identity">
          {entry.character_name && (
            <span className="sbxp-char"><i className="ti ti-sword" /> {entry.character_name}</span>
          )}
          <span className="sbxp-player"><i className="ti ti-user" /> {entry.name}</span>
          <span className="sbxp-meta-date">
            <i className="ti ti-clock" />
            {fmtDate(entry.sandbox_config_updated_at ?? meta?.timestamp)}
          </span>
        </div>

        <div className="sbxp-header-badges">
          {sandboxData
            ? failCount === 0
              ? <span className="sbxp-hbadge sbxp-hbadge-ok"><i className="ti ti-shield-check" /> {passCount}/{SANDBOX_RULES.length} OK</span>
              : <span className="sbxp-hbadge sbxp-hbadge-fail"><i className="ti ti-shield-exclamation" /> {failCount} violaç{failCount === 1 ? 'ão' : 'ões'}</span>
            : <span className="sbxp-hbadge sbxp-hbadge-miss"><i className="ti ti-clock-off" /> Sem dados</span>}
          {sandboxOk !== null && (
            <span className={`sbxp-hbadge ${sandboxOk ? 'sbxp-hbadge-ok' : 'sbxp-hbadge-fail'}`}>
              sandbox_ok: {sandboxOk ? 'true' : 'false'}
            </span>
          )}
        </div>
      </div>

      {/* ── Sem dados ── */}
      {!cfg && (
        <div className="sbxp-no-data">
          <i className="ti ti-adjustments-off" />
          <h3>Sandbox não enviado</h3>
          <p>As configurações de sandbox ainda não foram recebidas para este jogador.<br />
            O mod enviará automaticamente ao próximo save ou sync.</p>
        </div>
      )}

      {cfg && sandboxData && (
        <>
          {/* ── Tabs ── */}
          <div className="sbxp-tabs">
            <button className={`sbxp-tab${tab === 'validate' ? ' active' : ''}`} onClick={() => setTab('validate')}>
              <i className="ti ti-shield-check" /> Validação do Desafio
              {failCount > 0
                ? <span className="sbxp-tab-badge sbxp-fail-badge"><i className="ti ti-x" /> {failCount}</span>
                : <span className="sbxp-tab-badge sbxp-ok-badge">{passCount}/{SANDBOX_RULES.length}</span>}
            </button>
            <button className={`sbxp-tab${tab === 'config' ? ' active' : ''}`} onClick={() => setTab('config')}>
              <i className="ti ti-adjustments" /> Todas as Configurações
            </button>
          </div>

          {/* ── Conteúdo ── */}
          <div className="sbxp-content">
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