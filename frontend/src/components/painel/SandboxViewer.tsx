import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SANDBOX_RULES, validateSandbox, getNestedValue } from '../../lib/sandboxRules';
import type { Entry } from '../../types';

interface Props {
  entry: Entry;
  onClose: () => void;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const hh  = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear() + ' - ' + hh + ':' + min;
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, '');
  }
  return String(v);
}

type FilterMode = 'all' | 'fail' | 'ok';

function ValidationSection({ sandboxData, sandboxOk }: {
  sandboxData: Record<string, unknown>;
  sandboxOk?: boolean | null;
}) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const results = useMemo(() => validateSandbox(sandboxData), [sandboxData]);

  const passed  = results.filter(r => r.ok).length;
  const failed  = results.filter(r => !r.ok && !r.missing).length;
  const missing = results.filter(r => r.missing).length;
  const allOk   = failed === 0 && missing === 0;

  const sorted = useMemo(() => {
    const fail = results.filter(r => !r.ok && !r.missing);
    const miss = results.filter(r => r.missing);
    const ok   = results.filter(r => r.ok);
    return [...fail, ...miss, ...ok];
  }, [results]);

  const visible = useMemo(() => {
    if (filter === 'fail') return sorted.filter(r => !r.ok);
    if (filter === 'ok')   return sorted.filter(r => r.ok);
    return sorted;
  }, [sorted, filter]);

  return (
    <div className="sbx-validation">
      {/* Verdict banner */}
      <div className={`sbx-verdict ${allOk ? 'sbx-verdict-ok' : 'sbx-verdict-fail'}`}>
        <i className={`ti ${allOk ? 'ti-shield-check' : 'ti-shield-exclamation'}`} />
        <div className="sbx-verdict-text">
          <span className="sbx-verdict-title">
            {allOk
              ? 'Configuração válida'
              : `${failed + missing} violaç${(failed + missing) === 1 ? 'ão' : 'ões'} encontrada${(failed + missing) === 1 ? '' : 's'}`}
          </span>
          <span className="sbx-verdict-sub">
            {allOk
              ? `Todas as ${passed} regras do Brasileirão estão corretas`
              : `${failed} inválid${failed === 1 ? 'o' : 'os'} · ${missing} ausente${missing === 1 ? '' : 's'} · ${passed} ok`}
          </span>
        </div>
        {sandboxOk !== null && sandboxOk !== undefined && (
          <span className={`sbx-badge ${sandboxOk ? 'sbx-ok' : 'sbx-fail'}`}>
            {sandboxOk ? 'sandbox_ok ✓' : 'sandbox_ok ✗'}
          </span>
        )}
      </div>

      {/* Filter pills */}
      <div className="sbx-filter-row">
        <button
          className={`sbx-filter-pill${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos <span className="sbx-filter-count">{results.length}</span>
        </button>
        {failed + missing > 0 && (
          <button
            className={`sbx-filter-pill sbx-filter-fail${filter === 'fail' ? ' active' : ''}`}
            onClick={() => setFilter(filter === 'fail' ? 'all' : 'fail')}
          >
            <i className="ti ti-x" /> Falhas <span className="sbx-filter-count">{failed + missing}</span>
          </button>
        )}
        <button
          className={`sbx-filter-pill sbx-filter-ok${filter === 'ok' ? ' active' : ''}`}
          onClick={() => setFilter(filter === 'ok' ? 'all' : 'ok')}
        >
          <i className="ti ti-check" /> OK <span className="sbx-filter-count">{passed}</span>
        </button>
      </div>

      {/* Rules grid */}
      <div className="sbx-rules-grid">
        {visible.map(r => (
          <div
            key={r.rule.key}
            className={`sbx-rule${r.ok ? ' sbx-rule-ok' : r.missing ? ' sbx-rule-miss' : ' sbx-rule-fail'}`}
          >
            <div className="sbx-rule-status-icon">
              {r.ok
                ? <i className="ti ti-check" />
                : r.missing
                  ? <i className="ti ti-question-mark" />
                  : <i className="ti ti-x" />}
            </div>
            <div className="sbx-rule-body">
              <div className="sbx-rule-label">{r.rule.label}</div>
              <div className="sbx-rule-vals">
                {r.missing
                  ? <span className="sbx-rule-actual" style={{ fontStyle: 'italic', opacity: 0.5 }}>ausente</span>
                  : r.ok
                    ? <span className="sbx-rule-actual sbx-rule-ok-val">{fmtValue(r.actual)}</span>
                    : <span className="sbx-rule-actual sbx-rule-fail-val">{fmtValue(r.actual)}</span>}
                {!r.ok && (
                  <span className="sbx-rule-expected">esperado: {fmtValue(r.rule.expected)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  name,
  data,
  search,
}: {
  name: string;
  data: Record<string, unknown>;
  search: string;
}) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);

  const allEntries = Object.entries(data).filter(([, v]) => typeof v !== 'object' || v === null);

  const entries = allEntries.filter(([k, v]) => {
    if (!search) return true;
    return k.toLowerCase().includes(search) || String(v).toLowerCase().includes(search);
  });

  if (entries.length === 0) return null;

  // Auto-open when searching; collapse by default (except small named categories)
  const autoOpen = search.length > 0 || (name !== 'Geral' && allEntries.length <= 30);
  const isOpen = manualOpen !== null ? manualOpen : autoOpen;

  // Count validation failures for this category
  const failRows = entries.filter(([k, v]) => {
    const ruleKey = name + '.' + k;
    const rule = SANDBOX_RULES.find(r => r.key === ruleKey || r.key === k);
    if (!rule) return false;
    const expected = rule.expected;
    const actual = v;
    if (typeof expected === 'boolean') return actual !== expected;
    if (typeof expected === 'number' && typeof actual === 'number')
      return Math.abs(actual - expected) > (rule.tol ?? 0.01);
    return actual !== expected;
  }).length;

  return (
    <div className={`sbx-cat${failRows > 0 ? ' sbx-cat-has-fail' : ''}`}>
      <button className="sbx-cat-header" onClick={() => setManualOpen(!isOpen)}>
        <i className={`ti ${isOpen ? 'ti-chevron-down' : 'ti-chevron-right'}`} />
        <span className="sbx-cat-name">{name}</span>
        <span className="sbx-cat-count">{allEntries.length}</span>
        {failRows > 0 && (
          <span className="sbx-cat-fail"><i className="ti ti-x" /> {failRows}</span>
        )}
      </button>
      {isOpen && (
        <div className="sbx-cat-rows">
          {entries.map(([k, v]) => {
            const ruleKey = name + '.' + k;
            const rule = SANDBOX_RULES.find(r => r.key === ruleKey || r.key === k);
            const actual = typeof v === 'number' ? v : undefined;
            const expected = rule ? rule.expected : undefined;
            const ok = rule
              ? (typeof expected === 'boolean'
                  ? v === expected
                  : typeof expected === 'number' && typeof actual === 'number'
                    ? Math.abs(actual - expected) <= (rule.tol ?? 0.01)
                    : v === expected)
              : null;

            return (
              <div key={k} className={`sbx-row${ok === true ? ' sbx-row-ok' : ok === false ? ' sbx-row-fail' : ''}`}>
                <span className="sbx-row-key">{k}</span>
                <span className="sbx-row-val">{fmtValue(v)}</span>
                {rule && (
                  <span className={`sbx-row-badge${ok ? ' sbx-ok' : ' sbx-fail'}`}>
                    {ok ? '✓' : '✗ ' + fmtValue(expected)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SandboxViewer({ entry, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [tab,    setTab]    = useState<'validate' | 'all'>('validate');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' && tab === 'validate') setTab('all');
      if (e.key === 'ArrowLeft'  && tab === 'all')      setTab('validate');
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, tab]);

  const cfg = entry.sandbox_config;
  const sandboxData = (cfg && typeof cfg === 'object' && cfg.sandbox && typeof cfg.sandbox === 'object')
    ? (cfg.sandbox as Record<string, unknown>)
    : (cfg ?? null);

  const meta = cfg as { character?: string; timestamp?: string; version?: number } | null;

  const categories = useMemo(() => {
    if (!sandboxData) return [];
    const cats: { name: string; data: Record<string, unknown> }[] = [];
    const flat: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sandboxData as Record<string, unknown>)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        cats.push({ name: k, data: v as Record<string, unknown> });
      } else {
        flat[k] = v;
      }
    }
    if (Object.keys(flat).length > 0) cats.unshift({ name: 'Geral', data: flat });
    return cats;
  }, [sandboxData]);

  const flatSearch = search.toLowerCase();

  const { failCount, passCount } = useMemo(() => {
    if (!sandboxData) return { failCount: 0, passCount: 0 };
    const outcomes = SANDBOX_RULES.map(r => {
      const actual = getNestedValue(sandboxData as Record<string, unknown>, r.key);
      if (actual === undefined || actual === null) return false;
      if (typeof r.expected === 'boolean') return actual === r.expected;
      if (typeof r.expected === 'number' && typeof actual === 'number')
        return Math.abs(actual - r.expected) <= (r.tol ?? 0.01);
      return actual === r.expected;
    });
    return {
      failCount: outcomes.filter(r => !r).length,
      passCount: outcomes.filter(r => r).length,
    };
  }, [sandboxData]);

  const sandboxOk = entry.sandbox_ok ?? (cfg ? failCount === 0 : null);

  return createPortal(
    <div className="sbx-overlay" onClick={onClose}>
      <div
        className={`sbx-box${sandboxData && failCount === 0 ? ' sbx-box-ok' : sandboxData && failCount > 0 ? ' sbx-box-fail' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sbx-header">
          <div className="sbx-header-info">
            <span className="sbx-title">
              <i className="ti ti-adjustments" /> Configurações de Sandbox
            </span>
            <span className="sbx-subtitle">
              {entry.character_name && <><i className="ti ti-user" /> {entry.character_name} &middot; </>}
              {entry.name}
            </span>
          </div>
          <div className="sbx-header-meta">
            {meta?.timestamp && (
              <span className="sbx-meta-ts">
                <i className="ti ti-clock" /> {fmtDate(entry.sandbox_config_updated_at ?? meta.timestamp)}
              </span>
            )}
            {!cfg && (
              <span className="sbx-meta-ts sbx-meta-missing">
                <i className="ti ti-clock-off" /> Sandbox não enviado
              </span>
            )}
          </div>
          <button className="sm-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* No data */}
        {!cfg && (
          <div className="sbx-empty">
            <i className="ti ti-adjustments-off" />
            <p>Configurações de sandbox ainda não foram enviadas para este jogador.</p>
            <p className="sbx-empty-note">O mod enviará automaticamente ao próximo save ou sync.</p>
          </div>
        )}

        {cfg && (
          <>
            {/* Tabs */}
            <div className="sbx-tabs">
              <button
                className={`sbx-tab${tab === 'validate' ? ' active' : ''}`}
                onClick={() => setTab('validate')}
              >
                <i className="ti ti-shield-check" /> Validação
                {failCount > 0
                  ? <span className="sbx-tab-badge sbx-fail"><i className="ti ti-x" /> {failCount}</span>
                  : <span className="sbx-tab-badge sbx-ok">{passCount}/{SANDBOX_RULES.length}</span>}
              </button>
              <button
                className={`sbx-tab${tab === 'all' ? ' active' : ''}`}
                onClick={() => setTab('all')}
              >
                <i className="ti ti-list" /> Todas as Configurações
              </button>
              <span className="sbx-tab-hint">← → para navegar</span>
            </div>

            {/* Search (only on "all" tab) */}
            {tab === 'all' && (
              <div className="sbx-search-wrap">
                <i className="ti ti-search sbx-search-icon" />
                <input
                  className="sbx-search"
                  type="text"
                  placeholder="Pesquisar configuração..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button className="sbx-search-clear" onClick={() => setSearch('')}>
                    <i className="ti ti-x" />
                  </button>
                )}
              </div>
            )}

            {/* Validation view */}
            {tab === 'validate' && sandboxData && (
              <div className="sbx-validation-wrap">
                <ValidationSection
                  sandboxData={sandboxData as Record<string, unknown>}
                  sandboxOk={sandboxOk}
                />
              </div>
            )}

            {/* All configs view */}
            {tab === 'all' && (
              <div className="sbx-body">
                {!flatSearch && (
                  <p className="sbx-body-hint">
                    <i className="ti ti-info-circle" /> {categories.length} categorias · {categories.reduce((s, c) => s + Object.keys(c.data).length, 0)} configurações — use a busca ou clique em uma categoria para expandir
                  </p>
                )}
                {categories.map(cat => (
                  <CategorySection
                    key={cat.name}
                    name={cat.name}
                    data={cat.data}
                    search={flatSearch}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}