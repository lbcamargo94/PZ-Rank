import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiGetMods } from '../lib/api';
import type { Mod } from '../types';
import modsBg from '../../assets/background/tela-de-mods.webp';
import './mods.css';

const PAGE_SIZE = 15;

export function ModsPage() {
  const [mods,    setMods]    = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    apiGetMods()
      .then(setMods)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? mods.filter(m => m.name.toLowerCase().includes(q)) : mods;
    return [...list].sort((a, b) => Number(b.is_required) - Number(a.is_required));
  }, [mods, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mods-page claim-page-wrap" style={{ backgroundImage: `url(${modsBg})` }}>
      <div className="mods-header">
        <div className="mods-header-inner container">
          <Link to="/" className="wiki-back">
            <i className="ti ti-arrow-left" /> Voltar
          </Link>
          <div>
            <h1 className="mods-title"><i className="ti ti-puzzle" /> Mods Permitidos</h1>
            <p className="mods-subtitle">Mods aprovados para uso no desafio BRASILEIRÃO PZ</p>
          </div>
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
            <i className="ti ti-mood-empty" />
            <p>{search ? 'Nenhum mod encontrado para a busca.' : 'Nenhum mod permitido cadastrado ainda.'}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="mods-list">
              {paginated.map(mod => (
                <div key={mod.id} className="mod-card">
                  <div className="mod-card-info">
                    {mod.image_url
                      ? <img src={mod.image_url} alt="" className="mod-card-thumb" loading="lazy" />
                      : <i className="ti ti-puzzle mod-card-icon" />
                    }
                    <div className="mod-card-text">
                      <span className="mod-card-name">{mod.name}</span>
                      {mod.is_required && (
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

            {totalPages > 1 && (
              <div className="mods-pagination">
                <button
                  className="mods-page-btn"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <i className="ti ti-chevron-left" /> Anterior
                </button>
                <span className="mods-page-info">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </span>
                <button
                  className="mods-page-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                >
                  Próximo <i className="ti ti-chevron-right" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
