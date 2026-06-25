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
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, '');
  }
  return String(v);
}

function ValidationSection({ sandboxData }: { sandboxData: Record<string, unknown> }) {
  const results = useMemo(() => validateSandbox(sandboxData), [sandboxData]);
  const passed  = results.filter(r => r.ok).length;
  const failed  = results.filter(r => !r.ok && !r.missing).length;
  const missing = results.filter(r => r.missing).length;

  return (
    <div className="sbx-validation">
      <div className="sbx-val-header">
        <span className="sbx-val-title"><i className="ti ti-shield-check" /> Validação do Desafio Brasileirão</span>
        <div className="sbx-val-summary">
          <span className="sbx-badge sbx-ok"><i className="ti ti-check" /> {passed} OK</span>
          {failed  > 0 && <span className="sbx-badge sbx-fail"><i className="ti ti-x" /> {failed} inválido{failed > 1 ? 's' : ''}</span>}
          {missing > 0 && <span className="sbx-badge sbx-miss"><i className="ti ti-question-mark" /> {missing} ausente{missing > 1 ? 's' : ''}</span>}
        </div>
      </div>
      <div className="sbx-rules-grid">
        {results.map(r => (
          <div key={r.rule.key} className={`sbx-rule${r.ok ? ' sbx-rule-ok' : r.missing ? ' sbx-rule-miss' : ' sbx-rule-fail'}`}>
            <div className="sbx-rule-label">{r.rule.label}</div>
            <div className="sbx-rule-vals">
              <span className="sbx-rule-expected" title="Esperado">↦ {fmtValue(r.rule.expected)}</span>
              <span className={`sbx-rule-actual${r.ok ? ' sbx-rule-ok-val' : ' sbx-rule-fail-val'}`} title="Atual">
                {r.missing ? <em>ausente</em> : fmtValue(r.actual)}
              </span>
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
  const [open, setOpen] = useState(true);

  const entries = Object.entries(data).filter(([k, v]) => {
    if (typeof v === 'object' && v !== null) return false;
    if (!search) return true;
    return k.toLowerCase().includes(search) || String(v).toLowerCase().includes(search);
  });

  if (entries.length === 0) return null;

  return (
    <div className="sbx-cat">
      <button className="sbx-cat-header" onClick={() => setOpen(o => !o)}>
        <i className={`ti ${open ? 'ti-chevron-down' : 'ti-chevron-right'}`} />
        <span className="sbx-cat-name">{name}</span>
        <span className="sbx-cat-count">{entries.length}</span>
      </button>
      {open && (
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

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

  // Flat search across all keys
  const flatSearch = search.toLowerCase();

  const validationRulesPassCount = useMemo(() => {
    if (!sandboxData) return 0;
    return SANDBOX_RULES.filter(r => {
      const actual = getNestedValue(sandboxData as Record<string, unknown>, r.key);
      if (actual === undefined || actual === null) return false;
      if (typeof r.expected === 'boolean') return actual === r.expected;
      if (typeof r.expected === 'number' && typeof actual === 'number')
        return Math.abs(actual - r.expected) <= (r.tol ?? 0.01);
      return actual === r.expected;
    }).length;
  }, [sandboxData]);

  return createPortal(
    <div className="sbx-overlay" onClick={onClose}>
      <div className="sbx-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sbx-header">
          <div className="sbx-header-info">
            <span className="sbx-title"><i className="ti ti-adjustments" /> Configurações de Sandbox</span>
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
              <span className="sbx-meta-ts sbx-meta-missing">Sandbox não enviado</span>
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
                <span className="sbx-tab-badge sbx-ok">{validationRulesPassCount}/{SANDBOX_RULES.length}</span>
              </button>
              <button
                className={`sbx-tab${tab === 'all' ? ' active' : ''}`}
                onClick={() => setTab('all')}
              >
                <i className="ti ti-list" /> Todas as Configurações
              </button>
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
              <ValidationSection sandboxData={sandboxData as Record<string, unknown>} />
            )}

            {/* All configs view */}
            {tab === 'all' && (
              <div className="sbx-body">
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