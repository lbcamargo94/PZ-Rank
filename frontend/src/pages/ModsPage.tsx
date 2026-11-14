import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGetMods, apiGetModUsage } from '../lib/api';
import type { ModUsageResponse } from '../types';
import {
  groupMods, matchesQuery, sortGroups, isNewGroup, applyUsage, countByCategory,
  isStaleGroup, monthsSinceUpdate, fmtCount, categoryLabel, MOD_CATEGORIES, tabForExactModId,
  type ModGroup, type ModGroupStatus, type ModSort,
} from '../lib/modsList';
import { ModListChecker } from '../components/ModListChecker';
import './mods.css';

type ViewMode = 'list' | 'grid';

// Filtros ficam no endereço (/mods-lista?q=crafting&aba=bloqueados) para o moderador
// poder mandar o link de um resultado. Nomes em português, como o resto das rotas.
const TAB_PARAM: Record<ModGroupStatus, string> = { allowed: 'permitidos', mixed: 'parciais', blocked: 'bloqueados' };
const TAB_FROM_PARAM: Record<string, ModGroupStatus> = { permitidos: 'allowed', parciais: 'mixed', bloqueados: 'blocked' };

const TAB_LABEL: Record<ModGroupStatus, string> = {
  allowed: 'Permitidos',
  mixed:   'Parcialmente permitidos',
  blocked: 'Bloqueados',
};
const TAB_ICON: Record<ModGroupStatus, string> = {
  allowed: 'ti-circle-check',
  mixed:   'ti-adjustments-horizontal',
  blocked: 'ti-ban',
};
const TAB_HINT: Record<ModGroupStatus, string> = {
  allowed: 'Pode usar no desafio BRASILEIRÃO PZ.',
  mixed:   'Itens da Oficina com mais de um mod dentro: alguns IDs podem ser usados, outros não. Ative só os IDs permitidos.',
  blocked: 'Não pode usar no desafio. Quem joga com um destes é desclassificado.',
};
const TAB_ORDER: ModGroupStatus[] = ['allowed', 'mixed', 'blocked'];

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function groupDependencies(group: ModGroup) {
  const seen = new Set<number>();
  return group.mods.flatMap(m => m.dependencies).filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));
}

function ModIds({ group }: { group: ModGroup }) {
  const ids = group.mods.filter(m => m.mod_id);
  if (ids.length === 0) return null;
  if (group.status !== 'mixed') {
    return (
      <span className="ml-ids" title="ID do mod, como aparece no mods.txt do save">
        {ids.map((m, i) => (
          <span key={m.id}>{i > 0 && <span className="ml-ids-sep">·</span>}<code>{m.mod_id}</code></span>
        ))}
      </span>
    );
  }
  const ok  = ids.filter(m => m.status === 'active');
  const bad = ids.filter(m => m.status === 'blocked');
  return (
    <span className="ml-ids ml-ids-mixed">
      {ok.length > 0 && (
        <span className="ml-ids-ok"><i className="ti ti-check" aria-hidden="true" /> Pode usar: {ok.map((m, i) => (
          <span key={m.id}>{i > 0 && ', '}<code>{m.mod_id}</code></span>
        ))}</span>
      )}
      {bad.length > 0 && (
        <span className="ml-ids-bad"><i className="ti ti-x" aria-hidden="true" /> Não pode: {bad.map((m, i) => (
          <span key={m.id} title={m.block_reason ? `Motivo: ${m.block_reason}` : undefined}>{i > 0 && ', '}<code>{m.mod_id}</code></span>
        ))}</span>
      )}
    </span>
  );
}

function ModMeta({ group, now, activeCat }: { group: ModGroup; now: number; activeCat: string }) {
  // Obrigatório funciona por definição: o aviso de "parado" só confundiria quem está começando.
  const stale = !group.required && isStaleGroup(group, now);
  const parts: React.ReactNode[] = [];
  const cats = group.categories.filter(c => c !== 'outros')
    .sort((a, b) => Number(b === activeCat) - Number(a === activeCat));
  // Alguns autores marcam quase todas as tags: mostra 2 e o resto no "+N".
  if (cats.length) {
    const shown = cats.slice(0, 2).map(c => categoryLabel(c, true)).join(', ');
    parts.push(
      <span key="c" className="ml-meta-cat" title={cats.length > 2 ? cats.map(c => categoryLabel(c)).join(', ') : undefined}>
        {shown}{cats.length > 2 && ` +${cats.length - 2}`}
      </span>,
    );
  }
  if (group.subscriptions != null) {
    parts.push(<span key="s" title={`${group.subscriptions.toLocaleString('pt-BR')} inscritos na Oficina`}>{fmtCount(group.subscriptions)} inscritos</span>);
  }
  if (group.players != null && group.players > 0 && group.status !== 'blocked') {
    parts.push(<span key="u" className="ml-meta-used">Usado por {group.players} {group.players === 1 ? 'participante' : 'participantes'}</span>);
  }
  if (stale) {
    const m = monthsSinceUpdate(group, now);
    parts.push(
      <span key="w" className="ml-meta-stale" title="O autor não atualiza o mod há mais de 6 meses. Ele pode não funcionar na versão atual do jogo.">
        <i className="ti ti-alert-triangle" aria-hidden="true" /> Sem atualização há {m} meses
      </span>,
    );
  }
  if (parts.length === 0) return null;
  return <span className="ml-meta">{parts.map((p, i) => <span key={i}>{i > 0 && <span className="ml-meta-sep" aria-hidden="true">·</span>}{p}</span>)}</span>;
}

function ModRow({ group, anchor, now, activeCat }: { group: ModGroup; anchor?: string; now: number; activeCat: string }) {
  const { primary } = group;
  const deps    = groupDependencies(group);
  const reasons = group.status === 'blocked'
    ? Array.from(new Set(group.mods.map(m => m.block_reason).filter((r): r is string => !!r))).join(' | ')
    : '';
  return (
    <li id={anchor} className={`ml-item ml-item-${group.status}`}>
      {primary.image_url
        ? <img src={primary.image_url} alt="" className="ml-thumb" loading="lazy" decoding="async" />
        : <span className="ml-thumb ml-thumb-empty" aria-hidden="true"><i className="ti ti-puzzle" /></span>}
      <div className="ml-body">
        <div className="ml-name-row">
          <span className="ml-name">{primary.name}</span>
          {group.required && <span className="ml-tag ml-tag-required">Obrigatório</span>}
          {isNewGroup(group, now) && <span className="ml-tag ml-tag-new" title={`Adicionado em ${fmtDate(group.addedAt)}`}>Novo</span>}
        </div>
        <ModIds group={group} />
        <ModMeta group={group} now={now} activeCat={activeCat} />
        {deps.length > 0 && (
          <span className="ml-deps"><i className="ti ti-link" aria-hidden="true" /> Requer: {deps.map(d => d.name).join(', ')}</span>
        )}
        {reasons && (
          <span className="ml-reason"><i className="ti ti-message-exclamation" aria-hidden="true" /> {reasons}</span>
        )}
      </div>
      <a
        href={primary.workshop_url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-steam"
        aria-label={`Abrir ${primary.name} na Oficina Steam`}
      >
        <i className="ti ti-brand-steam" aria-hidden="true" /><span className="ml-steam-label">Oficina</span>
      </a>
    </li>
  );
}

export function ModsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [baseGroups, setGroups] = useState<ModGroup[]>([]);
  const [usage,   setUsage]   = useState<ModUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const search = params.get('q') ?? '';
  const exactTab = useMemo(() => tabForExactModId(baseGroups, search), [baseGroups, search]);
  // Sem aba no endereço, a busca por um ID exato abre na aba do item (links "Ver na lista")
  const tab: ModGroupStatus = TAB_FROM_PARAM[params.get('aba') ?? ''] ?? exactTab ?? 'allowed';
  const ordem = params.get('ordem');
  const sort: ModSort       = ordem === 'recentes' ? 'recent' : ordem === 'usados' ? 'used' : 'az';
  const cat                 = MOD_CATEGORIES.some(c => c.slug === params.get('cat')) ? params.get('cat')! : '';
  const view: ViewMode      = params.get('ver') === 'grade' ? 'grid' : 'list';
  const checking            = params.get('conferir') === '1';
  const controlsRef = useRef<HTMLDivElement>(null);

  // "Ver na lista" da conferência: filtra a lista pelo ID e rola até ela, mantendo o painel aberto.
  function seeInList(modId: string) {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('q', modId);
      next.delete('cat');
      next.delete('aba');
      return next;
    }, { replace: true });
    requestAnimationFrame(() => controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // Mantém o resto dos filtros e troca só um; o valor padrão sai do endereço.
  function setParam(key: string, value: string, fallback: string) {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (!value || value === fallback) next.delete(key); else next.set(key, value);
      return next;
    }, { replace: true });
  }

  useEffect(() => {
    // Busca ativos e bloqueados e junta antes de agrupar: um item com IDs em status
    // diferentes vira um grupo só, em vez de aparecer partido entre as abas.
    Promise.all([apiGetMods('active'), apiGetMods('blocked')])
      .then(([active, blocked]) => setGroups(groupMods([...active, ...blocked])))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
    // Uso é opcional: se falhar, a página funciona sem "Usado por" e sem "Mais usados".
    apiGetModUsage().then(setUsage).catch(() => setUsage(null));
  }, []);

  const groups = useMemo(() => applyUsage(baseGroups, usage), [baseGroups, usage]);

  const required = useMemo(
    () => sortGroups(groups.filter(g => g.required && g.status !== 'blocked'), 'az'),
    [groups],
  );

  const totals = useMemo(() => {
    const t: Record<ModGroupStatus, number> = { allowed: 0, mixed: 0, blocked: 0 };
    for (const g of groups) t[g.status]++;
    return t;
  }, [groups]);

  const matched = useMemo(() => groups.filter(g => matchesQuery(g, search)), [groups, search]);

  const matchedByTab = useMemo(() => {
    const t: Record<ModGroupStatus, number> = { allowed: 0, mixed: 0, blocked: 0 };
    for (const g of matched) t[g.status]++;
    return t;
  }, [matched]);

  const inTab = useMemo(() => matched.filter(g => g.status === tab), [matched, tab]);
  const catCounts = useMemo(() => countByCategory(inTab), [inTab]);
  const visible = useMemo(
    () => sortGroups(cat ? inTab.filter(g => g.categories.includes(cat)) : inTab, sort),
    [inTab, cat, sort],
  );

  // Primeira linha de cada letra recebe a âncora da barra A–Z.
  const anchors = useMemo(() => {
    const map = new Map<string, string>();
    if (sort !== 'az') return map;
    const seen = new Set<string>();
    for (const g of visible) {
      if (!seen.has(g.letter)) { seen.add(g.letter); map.set(g.key, `mods-letra-${g.letter === '#' ? 'num' : g.letter}`); }
    }
    return map;
  }, [visible, sort]);
  const lettersPresent = useMemo(() => new Set(visible.map(g => g.letter)), [visible]);

  const lastAdded = useMemo(() => groups.reduce((max, g) => Math.max(max, g.addedAt), 0), [groups]);

  // Busca sem resultado na aba atual, mas com resultado em outra: oferece trocar.
  const elsewhere = search && !cat && visible.length === 0
    ? TAB_ORDER.filter(s => s !== tab && matchedByTab[s] > 0)
    : [];

  function jumpTo(letter: string) {
    const id = `mods-letra-${letter === '#' ? 'num' : letter}`;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="mods-page ml-page">
      <div className="mods-header">
        <div className="mods-header-inner container">
          <button type="button" className="wiki-back" onClick={() => navigate(-1)}>
            <i className="ti ti-arrow-left" /> Voltar
          </button>
          <div>
            <h1 className="mods-title"><i className="ti ti-puzzle" /> Mods do Campeonato</h1>
            {!loading && !error && (
              <p className="ml-summary">
                {plural(totals.allowed, 'permitido', 'permitidos')}
                {totals.mixed > 0 && <> · {plural(totals.mixed, 'parcialmente permitido', 'parcialmente permitidos')}</>}
                {' · '}{plural(totals.blocked, 'bloqueado', 'bloqueados')}
                {lastAdded > 0 && <> · último adicionado em {fmtDate(lastAdded)}</>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container ml-wrap">
        {loading && (
          <div className="mods-empty-state">
            <i className="ti ti-loader-2" />
            <p>Carregando mods...</p>
          </div>
        )}

        {error && (
          <div className="mods-empty-state mods-error">
            <i className="ti ti-alert-triangle" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {required.length > 0 && (
              <section className="ml-required" aria-labelledby="ml-required-title">
                <h2 id="ml-required-title" className="ml-required-title">
                  <i className="ti ti-alert-circle" aria-hidden="true" /> Obrigatórios: instale {required.length === 1 ? 'este' : `estes ${required.length}`} antes de começar
                </h2>
                <ul className="ml-required-list">
                  {required.map(g => (
                    <li key={g.key}>
                      <a href={g.primary.workshop_url} target="_blank" rel="noopener noreferrer" className="ml-required-item">
                        {g.primary.image_url
                          ? <img src={g.primary.image_url} alt="" className="ml-required-thumb" loading="lazy" />
                          : <span className="ml-required-thumb ml-thumb-empty" aria-hidden="true"><i className="ti ti-puzzle" /></span>}
                        <span className="ml-required-text">
                          <span className="ml-required-name">{g.primary.name} <i className="ti ti-external-link" aria-hidden="true" /></span>
                          <span className="ml-required-ids">
                            {(() => {
                              const ids = g.mods.filter(m => m.mod_id && m.status === 'active').map(m => m.mod_id);
                              // Basta um dos IDs do item ativo (é o que as runs válidas usam)
                              return ids.length > 1 ? `um destes: ${ids.join(', ')}` : ids[0];
                            })()}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {checking ? (
              <ModListChecker groups={groups} onSeeInList={seeInList} onClose={() => setParam('conferir', '', '')} />
            ) : (
              <div className="ml-check-cta">
                <span><i className="ti ti-list-check" aria-hidden="true" /> Vai começar uma run? Cole o mods.txt do save e veja se algum mod desclassifica.</span>
                <button type="button" className="ml-check-open" onClick={() => setParam('conferir', '1', '')}>
                  Conferir minha lista
                </button>
              </div>
            )}

            <div className="ml-controls" ref={controlsRef}>
              <div className="wiki-search-wrap ml-search">
                <i className="ti ti-search wiki-search-icon" aria-hidden="true" />
                <input
                  className="wiki-search"
                  type="search"
                  placeholder="Buscar por nome, ID do mod ou link da Oficina"
                  aria-label="Buscar mod por nome, ID do mod ou link da Oficina"
                  value={search}
                  onChange={e => setParam('q', e.target.value, '')}
                />
                {search && (
                  <button className="wiki-search-clear" onClick={() => setParam('q', '', '')} aria-label="Limpar busca">
                    <i className="ti ti-x" />
                  </button>
                )}
              </div>

              <div className="ml-tabs" role="tablist" aria-label="Situação do mod">
                {TAB_ORDER.filter(s => s !== 'mixed' || totals.mixed > 0).map(s => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={tab === s}
                    className={`ml-tab ml-tab-${s}${tab === s ? ' active' : ''}`}
                    onClick={() => setParam('aba', TAB_PARAM[s], TAB_PARAM.allowed)}
                  >
                    <i className={`ti ${TAB_ICON[s]}`} aria-hidden="true" /> {TAB_LABEL[s]}
                    <span className="ml-tab-count">{search ? matchedByTab[s] : totals[s]}</span>
                  </button>
                ))}
              </div>

              <div className="ml-cats" role="group" aria-label="Categoria">
                <button type="button" aria-pressed={!cat} className={`ml-cat${!cat ? ' active' : ''}`} onClick={() => setParam('cat', '', '')}>
                  Todas <span className="ml-cat-count">{inTab.length}</span>
                </button>
                {MOD_CATEGORIES.filter(c => (catCounts.get(c.slug) ?? 0) > 0 || c.slug === cat).map(c => (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={cat === c.slug}
                    className={`ml-cat${cat === c.slug ? ' active' : ''}`}
                    onClick={() => setParam('cat', cat === c.slug ? '' : c.slug, '')}
                  >
                    {c.label} <span className="ml-cat-count">{catCounts.get(c.slug) ?? 0}</span>
                  </button>
                ))}
              </div>

              <div className="ml-toolbar">
                <label className="ml-sort">
                  <span>Ordenar</span>
                  <select value={sort} onChange={e => setParam('ordem', e.target.value === 'recent' ? 'recentes' : e.target.value === 'used' ? 'usados' : '', '')}>
                    <option value="az">A–Z</option>
                    <option value="recent">Adicionados recentemente</option>
                    {usage && <option value="used">Mais usados</option>}
                  </select>
                </label>
                <div className="ml-view" role="group" aria-label="Modo de exibição">
                  <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'active' : ''}
                          onClick={() => setParam('ver', '', '')}>
                    <i className="ti ti-list" aria-hidden="true" /> Lista
                  </button>
                  <button type="button" aria-pressed={view === 'grid'} className={view === 'grid' ? 'active' : ''}
                          onClick={() => setParam('ver', 'grade', '')}>
                    <i className="ti ti-layout-grid" aria-hidden="true" /> Grade
                  </button>
                </div>
                <span className="ml-count" aria-live="polite">
                  {search || cat
                    ? `${visible.length} de ${totals[tab]}`
                    : plural(visible.length, 'item', 'itens')}
                </span>
              </div>
            </div>

            <p className="ml-hint">
              {TAB_HINT[tab]}
              {sort === 'used' && usage && (
                <> Uso entre os {usage.participants} participantes com run válida nos últimos {usage.days} dias.</>
              )}
            </p>

            {sort === 'az' && visible.length > 12 && (
              <nav className="ml-az" aria-label="Pular para a letra">
                {LETTERS.map(l => (
                  <button key={l} type="button" disabled={!lettersPresent.has(l)} onClick={() => jumpTo(l)}>{l}</button>
                ))}
              </nav>
            )}

            {visible.length === 0 ? (
              <div className="mods-empty-state">
                <i className="ti ti-search-off" />
                <p>
                  {cat && !search
                    ? `Nenhum mod de ${categoryLabel(cat)} em ${TAB_LABEL[tab]}.`
                    : search
                    ? elsewhere.length > 0
                      ? `Nada encontrado para "${search}" em ${TAB_LABEL[tab]}.`
                      : `Nenhum mod encontrado para "${search}" em nenhuma das listas.`
                    : tab === 'blocked' ? 'Nenhum mod bloqueado no momento.' : 'Nenhum mod nesta lista ainda.'}
                </p>
                {elsewhere.length > 0 && (
                  <div className="ml-elsewhere">
                    {elsewhere.map(s => (
                      <button key={s} type="button" className="ml-elsewhere-btn" onClick={() => setParam('aba', TAB_PARAM[s], TAB_PARAM.allowed)}>
                        Encontrado em {TAB_LABEL[s]} ({matchedByTab[s]}) <i className="ti ti-arrow-right" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
                {search && elsewhere.length === 0 && (
                  <p className="ml-empty-note">Mod que não está em nenhuma lista não pode ser usado no desafio.</p>
                )}
              </div>
            ) : (
              <ul className={`ml-list${view === 'grid' ? ' ml-grid' : ''}`}>
                {visible.map(g => <ModRow key={g.key} group={g} anchor={anchors.get(g.key)} now={now} activeCat={cat} />)}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
