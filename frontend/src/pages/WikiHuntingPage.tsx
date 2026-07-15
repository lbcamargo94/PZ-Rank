import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import huntingData from '../data/wikiHunting.json';
import './wiki.css';

interface WikiHuntingDetail {
  label: string;
  text?: string;
  list?: string[];
  listIcons?: (string | null)[];
  chips?: string[];
}

interface WikiHuntingEntry {
  id: string;
  name: string;
  category: string;
  subtitle?: string;
  details: WikiHuntingDetail[];
}

const ALL_ENTRIES = huntingData as WikiHuntingEntry[];

const CATEGORY_ICONS: Record<string, string> = {
  'Armadilhas':          'ti-circle-dotted',
  'Pesca':               'ti-fish',
  'Caça':                'ti-paw',
  'Forrageamento':       'ti-leaf',
  'Receitas de Preparo': 'ti-soup',
};

function ItemList({ items, icons }: { items?: string[]; icons?: (string | null)[] }) {
  if (!items || items.length === 0) return <span className="wiki-empty">—</span>;
  return (
    <ul className="wiki-item-list">
      {items.map((item, i) => {
        const icon = icons?.[i];
        return (
          <li key={i} className="wiki-item-entry">
            {icon && (
              <img
                src={`/item-icons/${icon}.png`}
                alt=""
                className="wiki-item-icon"
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span>{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ChipList({ chips }: { chips: string[] }) {
  return (
    <div className="wiki-chips">
      {chips.map((chip, i) => <span key={i} className="wiki-chip">{chip}</span>)}
    </div>
  );
}

export function WikiHuntingPage() {
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('Todas');
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const e of ALL_ENTRIES) {
      if (!seen.has(e.category)) { seen.add(e.category); order.push(e.category); }
    }
    return ['Todas', ...order];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_ENTRIES.filter(e => {
      if (q && !e.name.toLowerCase().includes(q) && !e.subtitle?.toLowerCase().includes(q)) return false;
      if (activeTab !== 'Todas' && e.category !== activeTab) return false;
      return true;
    });
  }, [search, activeTab]);

  const grouped = useMemo(() => {
    if (activeTab !== 'Todas') return { [activeTab]: filtered };
    const map: Record<string, WikiHuntingEntry[]> = {};
    for (const e of filtered) {
      if (!map[e.category]) map[e.category] = [];
      map[e.category].push(e);
    }
    return map;
  }, [filtered, activeTab]);

  const groupKeys = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const e of ALL_ENTRIES) {
      if (!seen.has(e.category) && grouped[e.category]) {
        seen.add(e.category);
        order.push(e.category);
      }
    }
    return order;
  }, [grouped]);

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id);
  }

  return (
    <div className="wiki-page">
      {/* ── Header ── */}
      <div className="wiki-header">
        <div className="wiki-header-inner container">
          <div className="wiki-back-row">
            <Link to="/" className="wiki-back">
              <i className="ti ti-arrow-left" /> Voltar
            </Link>
            <Link to="/wiki" className="wiki-back">
              <i className="ti ti-book-2" /> Wiki de Receitas
            </Link>
          </div>
          <div>
            <h1 className="wiki-title"><i className="ti ti-fish" /> Enciclopédia de Caça &amp; Pesca</h1>
            <p className="wiki-subtitle">Project Zomboid — Build 42 · {ALL_ENTRIES.length} entradas</p>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="wiki-tabs-wrap">
        <div className="wiki-tabs container">
          {categories.map(cat => {
            const count = cat === 'Todas'
              ? ALL_ENTRIES.length
              : ALL_ENTRIES.filter(e => e.category === cat).length;
            const icon = CATEGORY_ICONS[cat] ?? 'ti-category';
            return (
              <button
                key={cat}
                className={`wiki-tab${activeTab === cat ? ' wiki-tab-active' : ''}`}
                onClick={() => { setActiveTab(cat); setExpanded(null); }}
              >
                <i className={`ti ${icon}`} />
                {cat}
                <span className="wiki-tab-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="wiki-filters-bar container">
        <div className="wiki-search-wrap">
          <i className="ti ti-search wiki-search-icon" />
          <input
            className="wiki-search"
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wiki-search-clear" onClick={() => setSearch('')} aria-label="Limpar">
              <i className="ti ti-x" />
            </button>
          )}
        </div>
        <span className="wiki-count">
          {filtered.length === ALL_ENTRIES.length
            ? `${ALL_ENTRIES.length} entradas`
            : `${filtered.length} de ${ALL_ENTRIES.length}`}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="container">
        {filtered.length === 0 ? (
          <div className="wiki-empty-state">
            <i className="ti ti-mood-empty" />
            <p>Nenhuma entrada encontrada</p>
          </div>
        ) : (
          groupKeys.map(cat => (
            <div key={cat} className="wiki-category-section">
              {activeTab === 'Todas' && (
                <div className="wiki-category-heading">
                  <i className={`ti ${CATEGORY_ICONS[cat] ?? 'ti-category'}`} />
                  <span>{cat}</span>
                  <span className="wiki-category-count">{grouped[cat].length}</span>
                </div>
              )}

              <div className="wiki-cards">
                {grouped[cat].map(entry => {
                  const isOpen = expanded === entry.id;
                  return (
                    <div key={entry.id} className={`wiki-card${isOpen ? ' wiki-card-open' : ''}`}>
                      <button
                        className="wiki-card-header"
                        onClick={() => toggleExpand(entry.id)}
                        aria-expanded={isOpen}
                      >
                        <div className="wiki-card-title-row">
                          <span className="wiki-recipe-name">{entry.name}</span>
                        </div>
                        {entry.subtitle && (
                          <div className="wiki-card-meta">
                            <span className="wiki-card-skill">{entry.subtitle}</span>
                          </div>
                        )}
                        <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} wiki-card-chevron`} />
                      </button>

                      {isOpen && (
                        <div className="wiki-card-body">
                          {entry.details.map((detail, i) => {
                            if (detail.list) {
                              return (
                                <div key={i} className="wiki-card-row wiki-card-row-block">
                                  <span className="wiki-card-label">{detail.label}</span>
                                  <ItemList items={detail.list} icons={detail.listIcons} />
                                </div>
                              );
                            }
                            if (detail.chips) {
                              return (
                                <div key={i} className="wiki-card-row wiki-card-row-block">
                                  <span className="wiki-card-label">{detail.label}</span>
                                  <ChipList chips={detail.chips} />
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="wiki-card-row">
                                <span className="wiki-card-label">{detail.label}</span>
                                <span>{detail.text ?? '—'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
