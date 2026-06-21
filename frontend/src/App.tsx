import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { apiGetEntries } from './lib/api';
import type { Entry, SortKey, ModSession } from './types';
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

function MainView() {
  const navigate = useNavigate();
  const [entries,      setEntries]      = useState<Entry[]>([]);
  const [sortKey,      setSortKey]      = useState<SortKey>('score');
  const [loadingRank,  setLoadingRank]  = useState(false);
  const [showRegister,  setShowRegister]  = useState(false);
  const [showRules,     setShowRules]     = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const { toast, showToast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoadingRank(true);
    try { setEntries(await apiGetEntries(sortKey)); }
    catch (err) { showToast((err as Error).message || 'Erro ao carregar ranking.', 'error'); }
    finally { setLoadingRank(false); }
  }, [sortKey, showToast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const maxDays  = entries.reduce((m, e) => Math.max(m, e.days),  0);
  const maxKills = entries.reduce((m, e) => Math.max(m, e.kills), 0);

  return (
    <>
      <Header
        onPainel={() => navigate('/painel')}
        onRules={() => setShowRules(true)}
        onSettings={() => setShowSettings(true)}
      />
      <main>
        <StatsBar total={entries.length} maxDays={maxDays} maxKills={maxKills} />
        <RankTable
          entries={entries}
          sortKey={sortKey}
          loading={loadingRank}
          onSort={setSortKey}
          onRegister={() => setShowRegister(true)}
          onReload={fetchEntries}
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
