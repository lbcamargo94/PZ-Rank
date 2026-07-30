import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetEntries, apiGetAllEntries } from '../lib/api';
import type { Entry, SortKey, RankTab } from '../types';
import { parseSkillMap, MAX_SKILL_LEVEL } from '../lib/skills';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { Header } from '../components/Header';
import { RankTable } from '../components/RankTable';
import { RulesModal } from '../components/RulesModal';
import { ChallengeSettingsModal } from '../components/ChallengeSettingsModal';

const TAB_CONFIG: { key: RankTab; label: string; icon: string }[] = [
  { key: 'rank',         label: 'Rank',             icon: 'ti-heartbeat' },
  { key: 'records',      label: 'Records',          icon: 'ti-trophy'    },
  { key: 'dead',         label: 'Mortes',           icon: 'ti-skull'     },
  { key: 'disqualified', label: 'Desclassificados', icon: 'ti-ban'       },
];

const DEAD_ZONE_MS = 15 * 24 * 60 * 60 * 1000;

function isInDeadZone(e: Entry): boolean {
  if (e.sandbox_ok !== false) return false;
  if (!e.disqualified_at) return false;
  return Date.now() - new Date(e.disqualified_at).getTime() > DEAD_ZONE_MS;
}

function countMaxedSkills(skills: string | null): number {
  if (!skills) return 0;
  const map = parseSkillMap(skills);
  return Array.from(map.values()).filter(l => l >= MAX_SKILL_LEVEL).length;
}

function sortEntries(list: Entry[], key: SortKey): Entry[] {
  return [...list].sort((a, b) => {
    switch (key) {
      case 'score':      return b.score - a.score;
      case 'days':       return b.days - a.days;
      case 'kills':      return b.kills - a.kills;
      case 'time':       return b.time_raw - a.time_raw;
      case 'skills':     return countMaxedSkills(b.skills) - countMaxedSkills(a.skills);
      case 'updated_at': {
        const ta = a.updated_at ?? a.created_at ?? '';
        const tb = b.updated_at ?? b.created_at ?? '';
        return tb.localeCompare(ta);
      }
      default: return 0;
    }
  });
}

export function RankPage() {
  const navigate = useNavigate();
  const [entries,      setEntries]     = useState<Entry[]>([]);
  const [allEntries,   setAllEntries]  = useState<Entry[]>([]);
  const [sortKey,      setSortKey]     = useState<SortKey>('score');
  const [loading,      setLoading]     = useState(false);
  const [activeTab,    setActiveTab]   = useState<RankTab>('rank');
  const [search,       setSearch]      = useState('');
  const [showRules,    setShowRules]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    document.body.classList.add('rank-page-active');
    return () => document.body.classList.remove('rank-page-active');
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const [regular, all] = await Promise.all([
        apiGetEntries('score'),
        apiGetAllEntries('score'),
      ]);
      setEntries(regular);
      setAllEntries(all);
    } catch (err) {
      showToast((err as Error).message || 'Erro ao carregar ranking.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const publicEntries  = useMemo(() => entries.filter(e => !isInDeadZone(e)), [entries]);
  const aliveEntries   = useMemo(() => publicEntries.filter(e => e.sandbox_ok !== false && e.is_alive),  [publicEntries]);
  const deadEntries    = useMemo(() => publicEntries.filter(e => e.sandbox_ok !== false && !e.is_alive), [publicEntries]);
  const discEntries    = useMemo(() => publicEntries.filter(e => e.sandbox_ok === false),                [publicEntries]);

  const recordsEntries = useMemo(() => {
    const best = new Map<string, Entry>();
    for (const e of allEntries) {
      const key = e.player_id != null ? String(e.player_id) : `n:${e.name}`;
      const cur = best.get(key);
      if (!cur || e.score > cur.score) best.set(key, e);
    }
    return Array.from(best.values()).sort((a, b) => b.score - a.score);
  }, [allEntries]);

  const tabCounts: Record<RankTab, number> = {
    rank:         aliveEntries.length,
    records:      recordsEntries.length,
    dead:         deadEntries.length,
    disqualified: discEntries.length,
  };

  const baseEntries = useMemo(() => {
    switch (activeTab) {
      case 'rank':         return aliveEntries;
      case 'records':      return recordsEntries;
      case 'dead':         return deadEntries;
      case 'disqualified': return discEntries;
    }
  }, [activeTab, aliveEntries, recordsEntries, deadEntries, discEntries]);

  const sortedEntries = useMemo(() => sortEntries(baseEntries, sortKey), [baseEntries, sortKey]);

  // Quando há busca ativa: pesquisa em TODAS as categorias combinadas
  const allCombinedEntries = useMemo(
    () => sortEntries([...aliveEntries, ...deadEntries, ...discEntries], sortKey),
    [aliveEntries, deadEntries, discEntries, sortKey],
  );

  const isSearching = search.trim().length > 0;

  const filteredEntries = useMemo(() => {
    if (!isSearching) return sortedEntries;
    const q = search.trim().toLowerCase();
    return allCombinedEntries.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.character_name?.toLowerCase().includes(q) ?? false)
    );
  }, [sortedEntries, allCombinedEntries, isSearching, search]);

  return (
    <>
      <Header
        onPainel={() => navigate('/painel')}
        onRules={() => setShowRules(true)}
        onSettings={() => setShowSettings(true)}
      />

      <main>
        <div className="container rank-page-top">
          <button className="btn-ghost btn-sm" onClick={() => navigate(-1)} type="button">
            <i className="ti ti-arrow-left" /> Voltar
          </button>
          <div className="rank-search-wrap">
            <i className="ti ti-search rank-search-icon" aria-hidden="true" />
            <input
              className="rank-search-input"
              type="search"
              placeholder="Buscar por jogador ou personagem em todas as categorias..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar jogador"
            />
            {search && (
              <button
                className="rank-search-clear"
                onClick={() => setSearch('')}
                aria-label="Limpar busca"
                type="button"
              >
                <i className="ti ti-x" />
              </button>
            )}
          </div>
          {isSearching && (
            <div className="rank-search-global-note" role="status">
              <i className="ti ti-search" />
              {filteredEntries.length === 0
                ? 'Nenhum resultado encontrado.'
                : `${filteredEntries.length} resultado${filteredEntries.length !== 1 ? 's' : ''} em todas as categorias`}
            </div>
          )}
        </div>

        <div className="container rank-tabs-bar">
          <div className="rank-tabs">
            {TAB_CONFIG.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`rank-tab tab-${key}${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <i className={`ti ${icon}`} />
                {label}
                <span className="rank-tab-badge">{tabCounts[key]}</span>
              </button>
            ))}
          </div>
        </div>

        <RankTable
          entries={filteredEntries}
          sortKey={sortKey}
          loading={loading}
          onSort={setSortKey}
          onReload={fetchEntries}
          tab={activeTab}
          iconOnly
          isSearching={isSearching}
        />
      </main>

      <Toast {...toast} onClose={clearToast} />

      {showRules    && <RulesModal             onClose={() => setShowRules(false)}    />}
      {showSettings && <ChallengeSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
