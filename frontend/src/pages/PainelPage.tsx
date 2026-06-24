import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiLogout, apiDeleteEntry, apiGetEntries, apiUpdateEntryStatus } from '../lib/api';
import type { Entry, SortKey } from '../types';
import type { ModSession } from '../types';
import { PainelLogin }           from '../components/painel/PainelLogin';
import { PendingPlayers }        from '../components/painel/PendingPlayers';
import { UpdateRankModal }       from '../components/painel/UpdateRankModal';
import { EditObjectivesModal }   from '../components/painel/EditObjectivesModal';
import { ModeratorsList }        from '../components/painel/ModeratorsList';
import { CreateModeratorModal }  from '../components/painel/CreateModeratorModal';
import { ConfirmModal }          from '../components/painel/ConfirmModal';
import {
  IconArrowLeft,
  IconLogout,
  IconUsers,
  IconListNumbers,
  IconShieldStar,
  IconTrophy,
  IconBan,
  IconHeartbeat,
  IconSkull,
  IconList,
  IconRefresh,
  IconListSearch,
  IconFilterOff,
  IconUser,
  IconCalendar,
  IconSword,
  IconStar,
  IconTarget,
  IconTrash,
} from '@tabler/icons-react';

type Tab         = 'players' | 'entries' | 'moderators';
type EntryFilter = 'all' | 'alive' | 'dead' | 'disqualified';

const ENTRY_FILTER_CONFIG: { key: EntryFilter; label: string; icon: React.ReactElement }[] = [
  { key: 'all',          label: 'Todos',           icon: <IconList      size={16} /> },
  { key: 'alive',        label: 'Vivos',            icon: <IconHeartbeat size={16} /> },
  { key: 'dead',         label: 'Mortos',           icon: <IconSkull     size={16} /> },
  { key: 'disqualified', label: 'Desclassificados', icon: <IconBan       size={16} /> },
];

interface Props {
  session:   ModSession | null;
  onSession: (s: ModSession | null) => void;
  onBack:    () => void;
}

function EntryStatusBadge({ entry }: { entry: Entry }) {
  if (entry.sandbox_ok === false)
    return <span className="alive-badge disqualified"><IconBan size={16} /> Desclassificado</span>;
  if (entry.is_alive)
    return <span className="alive-badge alive"><IconHeartbeat size={16} /> Vivo</span>;
  return <span className="alive-badge dead"><IconSkull size={16} /> Morto</span>;
}

export function PainelPage({ session, onSession, onBack }: Props) {
  const [tab,                  setTab]                  = useState<Tab>('players');
  const [entryFilter,          setEntryFilter]          = useState<EntryFilter>('all');
  const [showUpdateRank,       setShowUpdateRank]       = useState(false);
  const [showCreateMod,        setShowCreateMod]        = useState(false);
  const [editObjEntry,         setEditObjEntry]         = useState<Entry | null>(null);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<number | null>(null);
  const [entries,              setEntries]              = useState<Entry[]>([]);
  const [sortKey]                                       = useState<SortKey>('score');
  const [updatingEntry,        setUpdatingEntry]        = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    try { setEntries(await apiGetEntries(sortKey)); }
    catch (err) { toast.error((err as Error).message); }
  }, [sortKey]);

  const aliveEntries = useMemo(() => entries.filter(e => e.sandbox_ok !== false &&  e.is_alive), [entries]);
  const deadEntries  = useMemo(() => entries.filter(e => e.sandbox_ok !== false && !e.is_alive), [entries]);
  const discEntries  = useMemo(() => entries.filter(e => e.sandbox_ok === false),                [entries]);

  const filteredEntries = useMemo(() => {
    switch (entryFilter) {
      case 'all':          return entries;
      case 'alive':        return aliveEntries;
      case 'dead':         return deadEntries;
      case 'disqualified': return discEntries;
    }
  }, [entryFilter, entries, aliveEntries, deadEntries, discEntries]);

  const entryCounts: Record<EntryFilter, number> = {
    all:          entries.length,
    alive:        aliveEntries.length,
    dead:         deadEntries.length,
    disqualified: discEntries.length,
  };

  async function doDeleteEntry(id: number) {
    if (!session) return;
    setConfirmDeleteEntryId(null);
    try {
      await apiDeleteEntry(session.token, id);
      toast.success('Entrada removida.');
      fetchEntries();
    } catch (err) {
      toast.error((err as Error).message);
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
      toast.success(`Personagem marcado como ${label}.`);
      fetchEntries();
    } catch (err) {
      toast.error((err as Error).message);
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
    return <PainelLogin onSuccess={onSession} onBack={onBack} />;
  }

  return (
    <div className="painel-wrap">
      {/* ── Header do painel ── */}
      <header className="painel-header">
        <div className="container painel-header-inner">
          <div className="painel-header-left">
            <button className="btn-primary btn-sm" onClick={onBack}>
              <IconArrowLeft size={16} /> Ranking público
            </button>
            <span className="painel-title">Painel de Moderadores</span>
          </div>
          <div className="painel-header-right">
            <span className="mod-email">{session.login}</span>
            <span className={`player-status status-badge-${session.role}`}>
              {session.role === 'master' ? 'Master' : 'Moderador'}
            </span>
            <button className="btn-secondary btn-sm" onClick={handleLogout}>
              <IconLogout size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Navegação ── */}
      <div className="container painel-nav">
        <div className="painel-tabs">
          <button className={`painel-tab${tab === 'players' ? ' active' : ''}`}
            onClick={() => setTab('players')}>
            <IconUsers size={16} /> Jogadores
          </button>
          <button className={`painel-tab${tab === 'entries' ? ' active' : ''}`}
            onClick={() => { setTab('entries'); fetchEntries(); }}>
            <IconListNumbers size={16} /> Entradas
            {entries.length > 0 && <span className="rank-tab-badge">{entries.length}</span>}
          </button>
          <button className={`painel-tab${tab === 'moderators' ? ' active' : ''}`}
            onClick={() => setTab('moderators')}>
            <IconShieldStar size={16} /> Moderadores
          </button>
        </div>
        <button className="btn-primary" onClick={() => setShowUpdateRank(true)}>
          <IconTrophy size={16} /> Atualizar Rank
        </button>
      </div>

      {/* ── Conteúdo ── */}
      <main className="container painel-main">
        {tab === 'players' && (
          <PendingPlayers token={session.token} />
        )}

        {tab === 'moderators' && (
          <ModeratorsList
            token={session.token}
            currentId={session.token}
            onCreateClick={() => setShowCreateMod(true)}
          />
        )}

        {tab === 'entries' && (
          <div className="painel-section">
            <div className="painel-section-header">
              <h2><IconListNumbers size={18} /> Entradas no Ranking</h2>
              <button className="btn-primary btn-sm" onClick={fetchEntries}>
                <IconRefresh size={16} /> Atualizar
              </button>
            </div>

            <div className="painel-section-filter">
              <div className="filter-bar">
                {ENTRY_FILTER_CONFIG.map(({ key, label, icon }) => (
                  <button key={key}
                    className={`sort-btn filter-entry-${key}${entryFilter === key ? ' active' : ''}`}
                    onClick={() => setEntryFilter(key)}>
                    {icon}
                    {' '}{label}
                    <span className="rank-tab-badge">{entryCounts[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            {entries.length === 0 && (
              <div className="painel-empty-state">
                <IconListSearch size={20} />
                <p>Clique em "Atualizar" para carregar as entradas.</p>
              </div>
            )}

            {filteredEntries.length === 0 && entries.length > 0 && (
              <div className="painel-empty-state">
                <IconFilterOff size={20} />
                <p>Nenhuma entrada encontrada para este filtro.</p>
              </div>
            )}

            <div className="painel-entries-list">
              {filteredEntries.map(entry => {
                const busy = updatingEntry === entry.id;
                return (
                  <div key={entry.id} className={`painel-entry-card${entry.sandbox_ok === false ? ' entry-disqualified' : entry.is_alive ? ' entry-alive' : ' entry-dead'}`}>
                    <div className="painel-entry-identity">
                      <span className="painel-entry-char">{entry.character_name || '—'}</span>
                      <span className="painel-entry-player"><IconUser size={16} /> {entry.name}</span>
                    </div>
                    <div className="painel-entry-stats">
                      <span><IconCalendar size={14} /> {entry.days}d</span>
                      <span><IconSword size={14} /> {entry.kills.toLocaleString('pt-BR')}</span>
                      <span><IconStar size={14} /> {entry.score.toLocaleString('pt-BR')} pts</span>
                      <EntryStatusBadge entry={entry} />
                    </div>
                    <div className="painel-entry-actions">
                      <button
                        className="btn-success btn-sm"
                        disabled={busy || (entry.is_alive && entry.sandbox_ok !== false)}
                        title="Marcar como Vivo"
                        onClick={() => handleEntryStatus(entry.id!, { is_alive: true, sandbox_ok: true }, 'Vivo')}
                      >
                        <IconHeartbeat size={16} /> Vivo
                      </button>
                      <button
                        className="btn-warning btn-sm"
                        disabled={busy || (!entry.is_alive && entry.sandbox_ok !== false)}
                        title="Marcar como Morto"
                        onClick={() => handleEntryStatus(entry.id!, { is_alive: false, sandbox_ok: true }, 'Morto')}
                      >
                        <IconSkull size={16} /> Morto
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        disabled={busy || entry.sandbox_ok === false}
                        title="Desclassificar"
                        onClick={() => handleEntryStatus(entry.id!, { sandbox_ok: false }, 'Desclassificado')}
                      >
                        <IconBan size={16} /> Desc.
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        disabled={busy}
                        title="Editar objetivos"
                        onClick={() => setEditObjEntry(entry)}
                      >
                        <IconTarget size={16} /> Obj.
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        disabled={busy}
                        title="Remover entrada"
                        onClick={() => setConfirmDeleteEntryId(entry.id!)}
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {showUpdateRank && (
        <UpdateRankModal
          token={session.token}
          onClose={() => setShowUpdateRank(false)}
          onSuccess={fetchEntries}
        />
      )}

      {editObjEntry && (
        <EditObjectivesModal
          token={session.token}
          entry={editObjEntry}
          onClose={() => setEditObjEntry(null)}
          onSuccess={fetchEntries}
        />
      )}

      {showCreateMod && (
        <CreateModeratorModal
          token={session.token}
          onClose={() => setShowCreateMod(false)}
          onSuccess={() => {}}
        />
      )}

      {confirmDeleteEntryId !== null && (
        <ConfirmModal
          title="Remover entrada"
          message="Esta entrada será removida permanentemente do ranking. Esta ação não pode ser desfeita."
          confirmLabel="Remover"
          danger
          onConfirm={() => doDeleteEntry(confirmDeleteEntryId)}
          onCancel={() => setConfirmDeleteEntryId(null)}
        />
      )}
    </div>
  );
}