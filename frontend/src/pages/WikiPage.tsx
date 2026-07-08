import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import recipesData from '../data/wikiRecipes.json';
import './wiki.css';

interface WikiRecipe {
  id: string;
  name: string;
  category: string;
  learnMethod: 'sempre' | 'nivel' | 'manual';
  autoLearn?: string;
  skillRequired?: string;
  xp?: string;
  inputs?: string[];
  inputIcons?: (string | null)[];
  outputs?: string[];
  outputIcons?: (string | null)[];
}

const ALL_RECIPES = recipesData as WikiRecipe[];

const LEARN_LABEL: Record<string, string> = {
  nivel:  'Nível',
  manual: 'Livro',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Costura':              'ti-needle-thread',
  'Agricultura':          'ti-plant',
  'Culinária':            'ti-tools-kitchen-2',
  'Ferraria':             'ti-hammer',
  'Diversos':             'ti-box',
  'Carpintaria':          'ti-axe',
  'Metalurgia':           'ti-components',
  'Armamento':            'ti-sword',
  'Ferramentas':          'ti-tool',
  'Cerâmica':             'ti-bowl',
  'Móveis':               'ti-armchair',
  'Entalhamento':         'ti-trees',
  'Embalagem':            'ti-package',
  'Elétrica':             'ti-bolt',
  'Alvenaria':            'ti-wall',
  'Soldagem':             'ti-flame',
  'Geral':                'ti-dots',
  'Utensílios de Cozinha':'ti-soup',
  'Lâminas':              'ti-slice',
  'Montagem':             'ti-puzzle',
  'Armaduras':            'ti-shield',
  'Sobrevivência':        'ti-tent',
  'Reparos':              'ti-tool',
  'Pedra Lascada':        'ti-mountain',
  'Vidro':                'ti-glass-full',
  'Médico':               'ti-first-aid-kit',
  'Revestimentos':        'ti-layers-difference',
  'Pesca':                'ti-fish',
  'Construção':           'ti-building',
  'Barricadas':           'ti-barrier-block',
  'Animais':              'ti-paw',
};

function LearnBadge({ method }: { method: string }) {
  return (
    <span className={`wiki-badge wiki-badge-${method}`}>
      {LEARN_LABEL[method] ?? method}
    </span>
  );
}

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

export function WikiPage() {
  const [search,      setSearch]      = useState('');
  const [activeTab,   setActiveTab]   = useState('Todas');
  const [learnFilter, setLearnFilter] = useState('');
  const [expanded,    setExpanded]    = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(ALL_RECIPES.map(r => r.category));
    return ['Todas', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'))];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_RECIPES.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      if (activeTab !== 'Todas' && r.category !== activeTab) return false;
      if (learnFilter && r.learnMethod !== learnFilter) return false;
      return true;
    });
  }, [search, activeTab, learnFilter]);

  // Group filtered recipes by category (for "Todas" view)
  const grouped = useMemo(() => {
    if (activeTab !== 'Todas') return { [activeTab]: filtered };
    const map: Record<string, WikiRecipe[]> = {};
    for (const r of filtered) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    }
    return map;
  }, [filtered, activeTab]);

  const groupKeys = useMemo(() =>
    Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'pt')),
    [grouped]
  );

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id);
  }

  return (
    <div className="wiki-page">
      {/* ── Header ── */}
      <div className="wiki-header">
        <div className="wiki-header-inner container">
          <Link to="/" className="wiki-back">
            <i className="ti ti-arrow-left" /> Voltar
          </Link>
          <div>
            <h1 className="wiki-title"><i className="ti ti-book-2" /> Wiki de Receitas</h1>
            <p className="wiki-subtitle">Project Zomboid — Build 42 · {ALL_RECIPES.length} receitas</p>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="wiki-tabs-wrap">
        <div className="wiki-tabs container">
          {categories.map(cat => {
            const count = cat === 'Todas'
              ? ALL_RECIPES.length
              : ALL_RECIPES.filter(r => r.category === cat).length;
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

      {/* ── Search + Learn Filter ── */}
      <div className="wiki-filters-bar container">
        <div className="wiki-search-wrap">
          <i className="ti ti-search wiki-search-icon" />
          <input
            className="wiki-search"
            type="text"
            placeholder="Buscar receita..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wiki-search-clear" onClick={() => setSearch('')} aria-label="Limpar">
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        <select
          className="wiki-select"
          value={learnFilter}
          onChange={e => setLearnFilter(e.target.value)}
        >
          <option value="">Todos os métodos</option>
          <option value="nivel">Aprende por nível</option>
          <option value="manual">Aprende por livro</option>
        </select>

        <span className="wiki-count">
          {filtered.length === ALL_RECIPES.length
            ? `${ALL_RECIPES.length} receitas`
            : `${filtered.length} de ${ALL_RECIPES.length}`}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="container">
        {filtered.length === 0 ? (
          <div className="wiki-empty-state">
            <i className="ti ti-mood-empty" />
            <p>Nenhuma receita encontrada</p>
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
                {grouped[cat].map(r => {
                  const isOpen = expanded === r.id;
                  return (
                    <div key={r.id} className={`wiki-card${isOpen ? ' wiki-card-open' : ''}`}>
                      <button
                        className="wiki-card-header"
                        onClick={() => toggleExpand(r.id)}
                        aria-expanded={isOpen}
                      >
                        <div className="wiki-card-title-row">
                          <span className="wiki-recipe-name">{r.name}</span>
                          <LearnBadge method={r.learnMethod} />
                        </div>
                        {r.skillRequired && (
                          <div className="wiki-card-meta">
                            <span className="wiki-card-skill">{r.skillRequired}</span>
                          </div>
                        )}
                        <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} wiki-card-chevron`} />
                      </button>
                      {isOpen && (
                        <div className="wiki-card-body">
                          {r.autoLearn && (
                            <div className="wiki-card-row">
                              <span className="wiki-card-label">Auto-aprende</span>
                              <span>{r.autoLearn}</span>
                            </div>
                          )}
                          {r.xp && (
                            <div className="wiki-card-row">
                              <span className="wiki-card-label">XP</span>
                              <span>{r.xp}</span>
                            </div>
                          )}
                          {r.inputs && r.inputs.length > 0 && (
                            <div className="wiki-card-row wiki-card-row-block">
                              <span className="wiki-card-label">Ingredientes</span>
                              <ItemList items={r.inputs} icons={r.inputIcons} />
                            </div>
                          )}
                          {r.outputs && r.outputs.length > 0 && (
                            <div className="wiki-card-row wiki-card-row-block">
                              <span className="wiki-card-label">Resultado</span>
                              <ItemList items={r.outputs} icons={r.outputIcons} />
                            </div>
                          )}
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