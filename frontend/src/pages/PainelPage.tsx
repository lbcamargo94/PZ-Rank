import { useState, useCallback } from 'react';
import { apiLogout, apiDeleteEntry, apiGetEntries } from '../lib/api';
import type { Entry, SortKey } from '../types';
import type { ModSession } from '../types';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { PainelLogin }           from '../components/painel/PainelLogin';
import { PendingPlayers }        from '../components/painel/PendingPlayers';
import { UpdateRankModal }       from '../components/painel/UpdateRankModal';
import { ModeratorsList }        from '../components/painel/ModeratorsList';
import { CreateModeratorModal }  from '../components/painel/CreateModeratorModal';

type Tab = 'players' | 'rank';

interface Props {
  onBack: () => void;
}

export function PainelPage({ onBack }: Props) {
  const [session,        setSession]        = useState<ModSession | null>(null);
  const [tab,            setTab]            = useState<Tab>('players');
  const [showUpdateRank, setShowUpdateRank] = useState(false);
  const [showCreateMod,  setShowCreateMod]  = useState(false);
  const [entries,        setEntries]        = useState<Entry[]>([]);
  const [sortKey]                           = useState<SortKey>('days');
  const { toast, showToast }               = useToast();

  const fetchEntries = useCallback(async () => {
    try { setEntries(await apiGetEntries(sortKey)); }
    catch (err) { showToast((err as Error).message, 'error'); }
  }, [sortKey, showToast]);

  async function handleDeleteEntry(id: number) {
    if (!session || !confirm('Remover esta entrada do ranking?')) return;
    try {
      await apiDeleteEntry(session.token, id);
      showToast('Entrada removida.', 'success');
      fetchEntries();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  }

  async function handleLogout() {
    if (!session) return;
    try { await apiLogout(session.token); } catch { /* ignora */ }
    setSession(null);
  }

  if (!session) {
    return (
      <>
        <PainelLogin onSuccess={setSession} onBack={onBack} showToast={showToast} />
        <Toast {...toast} />
      </>
    );
  }

  return (
    <div className="painel-wrap">
      {/* ── Header do painel ── */}
      <header className="painel-header">
        <div className="container painel-header-inner">
          <div className="painel-header-left">
            <button className="btn-ghost" onClick={onBack}>
              <i className="ti ti-arrow-left" /> Ranking público
            </button>
            <span className="painel-title">Painel de Moderadores</span>
          </div>
          <div className="painel-header-right">
            <span className="mod-email">{session.login}</span>
            <span className={`player-status status-badge-${session.role}`}>
              {session.role === 'master' ? 'Master' : 'Moderador'}
            </span>
            <button className="btn-secondary btn-sm" onClick={handleLogout}>
              <i className="ti ti-logout" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Navegação ── */}
      <div className="container painel-nav">
        <div className="painel-tabs">
          <button className={`painel-tab${tab === 'players' ? ' active' : ''}`}
            onClick={() => setTab('players')}>
            <i className="ti ti-users" /> Jogadores
          </button>
          {session.role === 'master' && (
            <button className={`painel-tab${tab === 'rank' ? ' active' : ''}`}
              onClick={() => { setTab('rank'); fetchEntries(); }}>
              <i className="ti ti-list-numbers" /> Moderadores
            </button>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowUpdateRank(true)}>
          <i className="ti ti-trophy" /> Atualizar Rank
        </button>
      </div>

      {/* ── Conteúdo ── */}
      <main className="container painel-main">
        {tab === 'players' && (
          <PendingPlayers token={session.token} showToast={showToast} />
        )}
        {tab === 'rank' && session.role === 'master' && (
          <ModeratorsList
            token={session.token}
            currentId={session.token}
            showToast={showToast}
            onCreateClick={() => setShowCreateMod(true)}
          />
        )}

        {/* Tabela de entradas no painel para gestão */}
        <div className="painel-section">
          <div className="painel-section-header">
            <h2>Entradas no Ranking</h2>
            <button className="btn-ghost btn-sm" onClick={fetchEntries}>
              <i className="ti ti-refresh" /> Atualizar
            </button>
          </div>
          {entries.length === 0 && (
            <p className="painel-empty">Clique em "Atualizar" para carregar as entradas.</p>
          )}
          {entries.map(entry => (
            <div key={entry.id} className="player-card">
              <div className="player-card-info">
                <span className="player-nick">{entry.name}</span>
                <span className="player-status">{entry.character_name}</span>
                <span className="painel-entry-meta">
                  {entry.days}d · {entry.kills} kills
                </span>
              </div>
              <div className="player-card-actions">
                <button className="btn-danger btn-sm"
                  onClick={() => handleDeleteEntry(entry.id!)}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Toast {...toast} />

      {showUpdateRank && (
        <UpdateRankModal
          token={session.token}
          onClose={() => setShowUpdateRank(false)}
          onSuccess={fetchEntries}
          showToast={showToast}
        />
      )}

      {showCreateMod && session.role === 'master' && (
        <CreateModeratorModal
          token={session.token}
          onClose={() => setShowCreateMod(false)}
          onSuccess={() => {}}
          showToast={showToast}
        />
      )}
    </div>
  );
}
