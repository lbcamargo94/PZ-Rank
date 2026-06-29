import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { apiGetEntries, setOnUnauthorized } from './lib/api';
import type { Entry, SortKey, RankTab, ModSession } from './types';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { RankTable } from './components/RankTable';
import { PlayerRegisterModal } from './components/PlayerRegisterModal';
import { RulesModal } from './components/RulesModal';
import { ChallengeSettingsModal } from './components/ChallengeSettingsModal';
import { PainelPage } from './pages/PainelPage';
import { PlayerPage } from './pages/PlayerPage';
import { OverlayPage } from './pages/OverlayPage';

const TAB_CONFIG: { key: RankTab; label: string; icon: string }[] = [
  { key: 'rank',          label: 'Rank',             icon: 'ti-heartbeat' },
  { key: 'records',       label: 'Records',          icon: 'ti-trophy'    },
  { key: 'dead',          label: 'Mortos',           icon: 'ti-skull'     },
  { key: 'disqualified',  label: 'Desclassificados', icon: 'ti-ban'       },
];

const DEAD_ZONE_MS = 15 * 24 * 60 * 60 * 1000;

function isInDeadZone(e: Entry): boolean {
  if (e.sandbox_ok !== false) return false;
  if (!e.disqualified_at) return false;
  return Date.now() - new Date(e.disqualified_at).getTime() > DEAD_ZONE_MS;
}

function MainView() {
  const navigate = useNavigate();
  const [entries,       setEntries]      = useState<Entry[]>([]);
  const [sortKey,       setSortKey]      = useState<SortKey>('score');
  const [loadingRank,   setLoadingRank]  = useState(false);
  const [activeTab,     setActiveTab]    = useState<RankTab>('rank');
  const [showRegister,  setShowRegister] = useState(false);
  const [showRules,     setShowRules]    = useState(false);
  const [showSettings,  setShowSettings] = useState(false);
  const { toast, showToast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoadingRank(true);
    try { setEntries(await apiGetEntries(sortKey)); }
    catch (err) { showToast((err as Error).message || 'Erro ao carregar ranking.', 'error'); }
    finally { setLoadingRank(false); }
  }, [sortKey, showToast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Dead-zone entries are hidden from every public tab
  const publicEntries = useMemo(() => entries.filter(e => !isInDeadZone(e)), [entries]);

  const aliveEntries = useMemo(() => publicEntries.filter(e => e.sandbox_ok !== false && e.is_alive),  [publicEntries]);
  const deadEntries  = useMemo(() => publicEntries.filter(e => e.sandbox_ok !== false && !e.is_alive), [publicEntries]);
  const discEntries  = useMemo(() => publicEntries.filter(e => e.sandbox_ok === false),                [publicEntries]);

  const tabCounts: Record<RankTab, number> = {
    rank:         aliveEntries.length,
    records:      publicEntries.length,
    dead:         deadEntries.length,
    disqualified: discEntries.length,
  };

  const filteredEntries = useMemo(() => {
    switch (activeTab) {
      case 'rank':         return aliveEntries;
      case 'records':      return publicEntries;
      case 'dead':         return deadEntries;
      case 'disqualified': return discEntries;
    }
  }, [activeTab, publicEntries, aliveEntries, deadEntries, discEntries]);

  return (
    <>
      <Header
        onPainel={() => navigate('/painel')}
        onRules={() => setShowRules(true)}
        onSettings={() => setShowSettings(true)}
      />
      <main>
        <StatsBar
          alive={aliveEntries.length}
          dead={deadEntries.length}
          disqualified={discEntries.length}
        />

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
          loading={loadingRank}
          onSort={setSortKey}
          onRegister={() => setShowRegister(true)}
          onReload={fetchEntries}
          tab={activeTab}
        />
      </main>

      <Toast {...toast} />

      {showRegister && (
        <PlayerRegisterModal
          onClose={() => setShowRegister(false)}
          showToast={showToast}
        />
      )}
      {showRules     && <RulesModal             onClose={() => setShowRules(false)}    />}
      {showSettings  && <ChallengeSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [modSession, setModSession] = useState<ModSession | null>(() => {
    try {
      const raw = sessionStorage.getItem('mod_session');
      return raw ? (JSON.parse(raw) as ModSession) : null;
    } catch { return null; }
  });

  useEffect(() => {
    setOnUnauthorized(() => setModSession(null));
  }, []);

  useEffect(() => {
    if (modSession) sessionStorage.setItem('mod_session', JSON.stringify(modSession));
    else sessionStorage.removeItem('mod_session');
  }, [modSession]);

  return (
    <Routes>
      <Route path="/" element={<MainView />} />
      <Route path="/player/:id" element={<PlayerPage />} />
      <Route path="/overlay/:id" element={<OverlayPage />} />
      <Route path="/painel" element={
        <PainelPage
          session={modSession}
          onSession={setModSession}
          onBack={() => navigate('/')}
        />
      } />
    </Routes>
  );
}