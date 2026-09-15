import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetMods } from '../lib/api';
import type { Mod } from '../types';
import { Pagination } from '../components/Pagination';
import modsBg from '../../assets/background/tela-de-mods.webp';
import './mods.css';

const PAGE_SIZE = 15;

type ModTab = 'allowed' | 'blocked' | 'mixed';

// Um mesmo item da Oficina Steam pode empacotar mais de um mod (mod_id diferente,
// cada um com seu proprio status). Agrupa por workshop_id para mostrar 1 card por
// item — sem isso, o item apareceria repetido N vezes na lista, uma vez por mod_id.
// Mods sem workshop_id viram grupos de 1 (comportamento anterior, mantido).
function groupByWorkshop(list: Mod[]): Mod[][] {
  const map   = new Map<string, Mod[]>();
  const order: string[] = [];
  for (const m of list) {
    const key = m.workshop_id ? `w-${m.workshop_id}` : `m-${m.id}`;
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key)!.push(m);
  }
  return order.map(k => map.get(k)!);
}

function groupDependencies(group: Mod[]) {
  const seen = new Set<number>();
  return group.flatMap(m => m.dependencies).filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));
}

export function ModsPage() {
  const navigate = useNavigate();
  const [groups,  setGroups]  = useState<Mod[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<ModTab>('allowed');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);

  function goToPage(p: number) {
    setPage(p);
    // Ao trocar de página, volta o scroll pro topo da lista — sem isso o
    // usuário ficava parado na posição do último item da página anterior,
    // vendo o final da lista nova em vez do começo.
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    // Busca ativos e bloqueados e junta antes de agrupar — assim um item com IDs
    // em status diferentes (ex: 3 bloqueados + 1 permitido) vira UM grupo so,
    // com todos os IDs juntos, em vez de aparecer partido entre as duas abas.
    Promise.all([apiGetMods('active'), apiGetMods('blocked')])
      .then(([active, blocked]) => setGroups(groupByWorkshop([...active, ...blocked])))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, tab]);

  const allowedGroups = useMemo(() => groups.filter(g => g.every(m => m.status === 'active')),  [groups]);
  const blockedGroups = useMemo(() => groups.filter(g => g.every(m => m.status === 'blocked')), [groups]);
  const mixedGroups   = useMemo(
    () => groups.filter(g => !g.every(m => m.status === 'active') && !g.every(m => m.status === 'blocked')),
    [groups]
  );

  const visibleGroups = tab === 'allowed' ? allowedGroups : tab === 'blocked' ? blockedGroups : mixedGroups;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? visibleGroups.filter(g => g[0].name.toLowerCase().includes(q)) : visibleGroups;
    return [...list].sort((a, b) => Number(b[0].is_required) - Number(a[0].is_required));
  }, [visibleGroups, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Trava a página dentro do intervalo válido mesmo num frame antes do efeito
  // acima rodar (ex: troca de aba com uma lista menor) — sem isso a tabela podia
  // renderizar vazia por um instante, ou pior, ficar presa numa página fantasma.
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mods-page claim-page-wrap" style={{ backgroundImage: `url(${modsBg})` }}>
      <div className="mods-header">
        <div className="mods-header-inner container">
          <button type="button" className="wiki-back" onClick={() => navigate(-1)}>
            <i className="ti ti-arrow-left" /> Voltar
          </button>
          <div>
            <h1 className="mods-title"><i className="ti ti-puzzle" /> Mods do Campeonato</h1>
            <p className="mods-subtitle">
              {tab === 'allowed'
                ? 'Mods aprovados para uso no desafio BRASILEIRÃO PZ'
                : tab === 'blocked'
                  ? 'Mods que não podem ser usados no desafio BRASILEIRÃO PZ'
                  : 'Itens da Oficina que empacotam mais de um mod, com status diferente entre eles'}
            </p>
          </div>
        </div>
      </div>

      <div className="container mods-tabs-bar">
        <div className="rank-tabs">
          <button
            className={`rank-tab tab-allowed${tab === 'allowed' ? ' active' : ''}`}
            onClick={() => setTab('allowed')}
          >
            <i className="ti ti-circle-check" /> Permitidos
            <span className="rank-tab-badge">{allowedGroups.length}</span>
          </button>
          {mixedGroups.length > 0 && (
            <button
              className={`rank-tab tab-mixed${tab === 'mixed' ? ' active' : ''}`}
              onClick={() => setTab('mixed')}
            >
              <i className="ti ti-arrows-shuffle" /> Status misto
              <span className="rank-tab-badge">{mixedGroups.length}</span>
            </button>
          )}
          <button
            className={`rank-tab tab-blocked${tab === 'blocked' ? ' active' : ''}`}
            onClick={() => setTab('blocked')}
          >
            <i className="ti ti-ban" /> Bloqueados
            <span className="rank-tab-badge">{blockedGroups.length}</span>
          </button>
        </div>
      </div>

      <div className="mods-filters-bar container">
        <div className="wiki-search-wrap">
          <i className="ti ti-search wiki-search-icon" />
          <input
            className="wiki-search"
            type="text"
            placeholder="Buscar mod..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wiki-search-clear" onClick={() => setSearch('')} aria-label="Limpar">
              <i className="ti ti-x" />
            </button>
          )}
        </div>
        {!loading && !error && (
          <span className="wiki-count">
            {filtered.length === visibleGroups.length
              ? `${visibleGroups.length} item${visibleGroups.length !== 1 ? 's' : ''}`
              : `${filtered.length} de ${visibleGroups.length}`}
          </span>
        )}
      </div>

      <div className="container">
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

        {!loading && !error && filtered.length === 0 && (
          <div className="mods-empty-state">
            <i className={`ti ${tab === 'allowed' ? 'ti-mood-empty' : tab === 'blocked' ? 'ti-mood-check' : 'ti-arrows-shuffle'}`} />
            <p>
              {search
                ? 'Nenhum mod encontrado para a busca.'
                : tab === 'allowed'
                  ? 'Nenhum mod permitido cadastrado ainda.'
                  : tab === 'blocked'
                    ? 'Nenhum mod bloqueado no momento.'
                    : 'Nenhum item com status misto no momento.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div ref={listTopRef} />
            <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />

            <div className="mods-list">
              {paginated.map(group => {
                const primary    = group[0];
                const allBlocked = group.every(m => m.status === 'blocked');
                const isMixed    = !group.every(m => m.status === 'active') && !allBlocked;
                const deps       = groupDependencies(group);
                const reasons    = Array.from(new Set(group.map(m => m.block_reason).filter((r): r is string => !!r))).join(' | ');
                return (
                  <div key={primary.id} className={`mod-card${allBlocked ? ' mod-card-blocked' : ''}${isMixed ? ' mod-card-mixed' : ''}`}>
                    <div className="mod-card-info">
                      {primary.image_url
                        ? <img src={primary.image_url} alt="" className="mod-card-thumb" loading="lazy" />
                        : <i className="ti ti-puzzle mod-card-icon" />
                      }
                      <div className="mod-card-text">
                        <span className="mod-card-name">{primary.name}</span>
                        {allBlocked ? (
                          <span className="mod-badge-blocked">
                            <i className="ti ti-ban" /> Bloqueado
                          </span>
                        ) : isMixed ? (
                          <span className="mod-badge-mixed">
                            <i className="ti ti-arrows-shuffle" /> Status misto
                          </span>
                        ) : primary.is_required && (
                          <span className="mod-badge-required">
                            <i className="ti ti-alert-circle" /> Obrigatório
                          </span>
                        )}
                        <div className="mod-card-idlist">
                          {group.filter(m => m.mod_id).map(m => (
                            <span
                              key={m.id}
                              className="mod-id-chip"
                              title={m.status === 'blocked' && m.block_reason ? `Motivo: ${m.block_reason}` : undefined}
                            >
                              <code>{m.mod_id}</code>
                              <span className={`mod-id-chip-status ${m.status}`}>
                                {m.status === 'blocked' ? 'Bloqueado' : 'Permitido'}
                              </span>
                            </span>
                          ))}
                        </div>
                        {deps.length > 0 && (
                          <span className="mod-card-deps">
                            <i className="ti ti-link" /> Requer: {deps.map(d => d.name).join(', ')}
                          </span>
                        )}
                        {reasons && (
                          <span className="mod-card-block-reason">
                            <i className="ti ti-message-exclamation" /> {reasons}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={primary.workshop_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary btn-sm"
                    >
                      <i className="ti ti-brand-steam" /> Oficina Steam
                    </a>
                  </div>
                );
              })}
            </div>

            <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}
