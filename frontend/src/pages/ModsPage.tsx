import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGetMods } from '../lib/api';
import type { Mod } from '../types';
import { Pagination } from '../components/Pagination';
import modsBg from '../../assets/background/tela-de-mods.webp';
import './mods.css';

const PAGE_SIZE = 15;

type ModTab = 'allowed' | 'blocked';

export function ModsPage() {
  const [allowedMods, setAllowedMods] = useState<Mod[]>([]);
  const [blockedMods, setBlockedMods] = useState<Mod[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [error,        setError]      = useState<string | null>(null);
  const [tab,          setTab]        = useState<ModTab>('allowed');
  const [search,       setSearch]     = useState('');
  const [page,         setPage]       = useState(1);
  const listTopRef = useRef<HTMLDivElement>(null);

  function goToPage(p: number) {
    setPage(p);
    // Ao trocar de página, volta o scroll pro topo da lista — sem isso o
    // usuário ficava parado na posição do último item da página anterior,
    // vendo o final da lista nova em vez do começo.
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    Promise.all([apiGetMods('active'), apiGetMods('blocked')])
      .then(([active, blocked]) => { setAllowedMods(active); setBlockedMods(blocked); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, tab]);

  const mods = tab === 'allowed' ? allowedMods : blockedMods;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? mods.filter(m => m.name.toLowerCase().includes(q)) : mods;
    return [...list].sort((a, b) => Number(b.is_required) - Number(a.is_required));
  }, [mods, search]);

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
          <Link to="/" className="wiki-back">
            <i className="ti ti-arrow-left" /> Voltar
          </Link>
          <div>
            <h1 className="mods-title"><i className="ti ti-puzzle" /> Mods do Campeonato</h1>
            <p className="mods-subtitle">
              {tab === 'allowed'
                ? 'Mods aprovados para uso no desafio BRASILEIRÃO PZ'
                : 'Mods que não podem ser usados no desafio BRASILEIRÃO PZ'}
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
            <span className="rank-tab-badge">{allowedMods.length}</span>
          </button>
          <button
            className={`rank-tab tab-blocked${tab === 'blocked' ? ' active' : ''}`}
            onClick={() => setTab('blocked')}
          >
            <i className="ti ti-ban" /> Bloqueados
            <span className="rank-tab-badge">{blockedMods.length}</span>
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
            {filtered.length === mods.length
              ? `${mods.length} mod${mods.length !== 1 ? 's' : ''}`
              : `${filtered.length} de ${mods.length}`}
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
            <i className={`ti ${tab === 'allowed' ? 'ti-mood-empty' : 'ti-mood-check'}`} />
            <p>
              {search
                ? 'Nenhum mod encontrado para a busca.'
                : tab === 'allowed'
                  ? 'Nenhum mod permitido cadastrado ainda.'
                  : 'Nenhum mod bloqueado no momento.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div ref={listTopRef} />
            <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />

            <div className="mods-list">
              {paginated.map(mod => (
                <div key={mod.id} className={`mod-card${tab === 'blocked' ? ' mod-card-blocked' : ''}`}>
                  <div className="mod-card-info">
                    {mod.image_url
                      ? <img src={mod.image_url} alt="" className="mod-card-thumb" loading="lazy" />
                      : <i className="ti ti-puzzle mod-card-icon" />
                    }
                    <div className="mod-card-text">
                      <span className="mod-card-name">{mod.name}</span>
                      {tab === 'blocked' ? (
                        <span className="mod-badge-blocked">
                          <i className="ti ti-ban" /> Bloqueado
                        </span>
                      ) : mod.is_required && (
                        <span className="mod-badge-required">
                          <i className="ti ti-alert-circle" /> Obrigatório
                        </span>
                      )}
                      {mod.dependencies.length > 0 && (
                        <span className="mod-card-deps">
                          <i className="ti ti-link" /> Requer: {mod.dependencies.map(d => d.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={mod.workshop_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-sm"
                  >
                    <i className="ti ti-brand-steam" /> Oficina Steam
                  </a>
                </div>
              ))}
            </div>

            <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}
