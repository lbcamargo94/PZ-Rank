import { useState, useEffect, useCallback } from 'react';
import { apiGetEntries } from './lib/api';
import type { Entry, SortKey, ModSession } from './types';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { RankTable } from './components/RankTable';
import { PlayerRegisterModal } from './components/PlayerRegisterModal';
import { RulesModal } from './components/RulesModal';
import { PainelPage } from './pages/PainelPage';

type Page = 'public' | 'painel';

export default function App() {
  const [page,         setPage]         = useState<Page>(() =>
    window.location.hash === '#painel' ? 'painel' : 'public'
  );
  const [modSession,   setModSession]   = useState<ModSession | null>(null);
  const [entries,      setEntries]      = useState<Entry[]>([]);
  const [sortKey,      setSortKey]      = useState<SortKey>('days');
  const [loadingRank,  setLoadingRank]  = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRules,    setShowRules]    = useState(false);
  const { toast, showToast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoadingRank(true);
    try { setEntries(await apiGetEntries(sortKey)); }
    catch (err) { showToast((err as Error).message || 'Erro ao carregar ranking.', 'error'); }
    finally { setLoadingRank(false); }
  }, [sortKey, showToast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function navigate(p: Page) {
    window.location.hash = p === 'painel' ? '#painel' : '';
    setPage(p);
  }

  const maxDays  = entries.reduce((m: number, e: Entry) => Math.max(m, e.days),  0);
  const maxKills = entries.reduce((m: number, e: Entry) => Math.max(m, e.kills), 0);

  if (page === 'painel') {
    return (
      <PainelPage
        session={modSession}
        onSession={setModSession}
        onBack={() => navigate('public')}
      />
    );
  }

  return (
    <>
      <Header onPainel={() => navigate('painel')} onRules={() => setShowRules(true)} />

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

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </>
  );
}
