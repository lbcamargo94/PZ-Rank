import { useState, useCallback } from 'react';
import { apiLogout, apiDeleteEntry, apiGetEntries, apiUpdateEntryStatus } from '../lib/api';
import type { Entry, SortKey } from '../types';
import type { ModSession } from '../types';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { PainelLogin }           from '../components/painel/PainelLogin';
import { PendingPlayers }        from '../components/painel/PendingPlayers';
import { UpdateRankModal }       from '../components/painel/UpdateRankModal';
import { EditObjectivesModal }   from '../components/painel/EditObjectivesModal';
import { ModeratorsList }        from '../components/painel/ModeratorsList';
import { CreateModeratorModal }  from '../components/painel/CreateModeratorModal';

type Tab = 'players' | 'rank';

interface Props {
  session:   ModSession | null;
  onSession: (s: ModSession | null) => void;
  onBack:    () => void;
}

function EntryStatusBadge({ entry }: { entry: Entry }) {
  if (entry.sandbox_ok === false)
    return <span className="alive-badge disqualified"><i className="ti ti-ban" /> Desclassificado</span>;
  if (entry.is_alive)
    return <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>;
  return <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>;
}

export function PainelPage({ session, onSession, onBack }: Props) {
  const [tab,            setTab]            = useState<Tab>('players');
  const [showUpdateRank, setShowUpdateRank] = useState(false);
  const [showCreateMod,  setShowCreateMod]  = useState(false);
  const [editObjEntry,   setEditObjEntry]   = useState<Entry | null>(null);
  const [entries,        setEntries]        = useState<Entry[]>([]);
  const [sortKey]                           = useState<SortKey>('score');
  const [updatingEntry,  setUpdatingEntry]  = useState<number | null>(null);
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

  async function handleEntryStatus(
    id: number,
    patch: { is_alive?: boolean; sandbox_ok?: boolean },
    label: string,
  ) {
    if (!session) return;
    setUpdatingEntry(id);
    try {
      await apiUpdateEntryStatus(session.token, id, patch);
      showToast(`Personagem marcado como ${label}.`, 'success');
      fetchEntries();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdatingEntry(null);
    }
  }

  async function handleLogout() {
    if (!session) return;
    try { await apiLogout(session.token); } catch { /* ignora */ }
    onSession(null);
  }

  if (!session) {
    return (
      <>
        <PainelLogin onSuccess={onSession} onBack={onBack} showToast={showToast} />
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
            <button className="btn-primary btn-sm" onClick={onBack}>
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
          <button className={`painel-tab${tab === 'rank' ? ' active' : ''}`}
            onClick={() => { setTab('rank'); fetchEntries(); }}>
            <i className="ti ti-shield-star" /> Moderadores
          </button>
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
        {tab === 'rank' && (
          <ModeratorsList
            token={session.token}
            currentId={session.token}
            showToast={showToast}
            onCreateClick={() => setShowCreateMod(true)}
          />
        )}

        {/* ── Entradas no Ranking ── */}
        <div className="painel-section">
          <div className="painel-section-header">
            <h2><i className="ti ti-list-numbers" /> Entradas no Ranking</h2>
            <button className="btn-primary btn-sm" onClick={fetchEntries}>
              <i className="ti ti-refresh" /> Carregar
            </button>
          </div>

          {entries.length === 0 && (
            <p className="painel-empty">Clique em "Carregar" para ver as entradas.</p>
          )}

          <div className="painel-entries-list">
            {entries.map(entry => {
              const busy = updatingEntry === entry.id;
              return (
                <div key={entry.id} className={`painel-entry-card${entry.sandbox_ok === false ? ' entry-disqualified' : entry.is_alive ? ' entry-alive' : ' entry-dead'}`}>
                  <div className="painel-entry-identity">
                    <span className="painel-entry-char">{entry.character_name || '—'}</span>
                    <span className="painel-entry-player"><i className="ti ti-user" /> {entry.name}</span>
                  </div>
                  <div className="painel-entry-stats">
                    <span><i className="ti ti-calendar" /> {entry.days}d</span>
                    <span><i className="ti ti-sword" /> {entry.kills.toLocaleString('pt-BR')}</span>
                    <span><i className="ti ti-star" /> {entry.score.toLocaleString('pt-BR')} pts</span>
                    <EntryStatusBadge entry={entry} />
                  </div>
                  <div className="painel-entry-actions">
                    <button
                      className="btn-success btn-sm"
                      disabled={busy || (entry.is_alive && entry.sandbox_ok !== false)}
                      title="Marcar como Vivo"
                      onClick={() => handleEntryStatus(entry.id!, { is_alive: true, sandbox_ok: true }, 'Vivo')}
                    >
                      <i className="ti ti-heartbeat" /> Vivo
                    </button>
                    <button
                      className="btn-warning btn-sm"
                      disabled={busy || (!entry.is_alive && entry.sandbox_ok !== false)}
                      title="Marcar como Morto"
                      onClick={() => handleEntryStatus(entry.id!, { is_alive: false, sandbox_ok: true }, 'Morto')}
                    >
                      <i className="ti ti-skull" /> Morto
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      disabled={busy || entry.sandbox_ok === false}
                      title="Desclassificar"
                      onClick={() => handleEntryStatus(entry.id!, { sandbox_ok: false }, 'Desclassificado')}
                    >
                      <i className="ti ti-ban" /> Desc.
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      disabled={busy}
                      title="Editar objetivos"
                      onClick={() => setEditObjEntry(entry)}
                    >
                      <i className="ti ti-target" /> Obj.
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      disabled={busy}
                      title="Remover entrada"
                      onClick={() => handleDeleteEntry(entry.id!)}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

      {editObjEntry && (
        <EditObjectivesModal
          token={session.token}
          entry={editObjEntry}
          onClose={() => setEditObjEntry(null)}
          onSuccess={fetchEntries}
          showToast={showToast}
        />
      )}

      {showCreateMod && (
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
