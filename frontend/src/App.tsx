import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiGetEntries } from './lib/api';
import type { Entry, SortKey, RankTab, ModSession } from './types';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { RankTable } from './components/RankTable';
import { PlayerRegisterModal } from './components/PlayerRegisterModal';
import { RulesModal } from './components/RulesModal';
import { ChallengeSettingsModal } from './components/ChallengeSettingsModal';
import { PainelPage } from './pages/PainelPage';
import { PlayerPage } from './pages/PlayerPage';
import { OverlayPage } from './pages/OverlayPage';

function MainView() {
  const navigate = useNavigate();
  const [entries,       setEntries]      = useState<Entry[]>([]);
  const [sortKey,       setSortKey]      = useState<SortKey>('score');
  const [loadingRank,   setLoadingRank]  = useState(false);
  const [activeTab,     setActiveTab]    = useState<RankTab>('rank');
  const [showRegister,  setShowRegister] = useState(false);
  const [showRules,     setShowRules]    = useState(false);
  const [showSettings,  setShowSettings] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoadingRank(true);
    try { setEntries(await apiGetEntries(sortKey)); }
    catch (err) { toast.error((err as Error).message || 'Erro ao carregar ranking.'); }
    finally { setLoadingRank(false); }
  }, [sortKey]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const aliveEntries = useMemo(() => entries.filter(e => e.sandbox_ok !== false && e.is_alive),  [entries]);
  const deadEntries  = useMemo(() => entries.filter(e => e.sandbox_ok !== false && !e.is_alive), [entries]);
  const discEntries  = useMemo(() => entries.filter(e => e.sandbox_ok === false),                 [entries]);

  const filteredEntries = useMemo(() => {
    switch (activeTab) {
      case 'rank':         return aliveEntries;
      case 'records':      return entries;
      case 'dead':         return deadEntries;
      case 'disqualified': return discEntries;
    }
  }, [activeTab, entries, aliveEntries, deadEntries, discEntries]);

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

        <RankTable
          entries={filteredEntries}
          sortKey={sortKey}
          loading={loadingRank}
          onSort={setSortKey}
          onRegister={() => setShowRegister(true)}
          onReload={fetchEntries}
          tab={activeTab}
          onTabChange={setActiveTab}
          aliveCount={aliveEntries.length}
          deadCount={deadEntries.length}
          discCount={discEntries.length}
          totalCount={entries.length}
        />
      </main>

      {showRegister && (
        <PlayerRegisterModal onClose={() => setShowRegister(false)} />
      )}
      {showRules    && <RulesModal             onClose={() => setShowRules(false)}    />}
      {showSettings && <ChallengeSettingsModal onClose={() => setShowSettings(false)} />}
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