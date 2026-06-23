import { useState, useEffect, useCallback } from 'react';
import { apiGetPlayers, apiUpdatePlayerStatus, apiBlockPlayer, apiUnblockPlayer, apiDeletePlayer, apiRestorePlayer } from '../../lib/api';
import type { Player, PlayerStatus, PlayerFilter } from '../../types';
import { ConfirmModal } from './ConfirmModal';
import {
  IconUsers,
  IconClock,
  IconCheck,
  IconX,
  IconLock,
  IconTrash,
  IconList,
  IconLoader2,
  IconUserOff,
  IconBrandTwitch,
  IconBrandYoutube,
  IconBrandKick,
  IconBrandTiktok,
  IconRefresh,
  IconLockOpen,
  IconInfoCircle,
} from '@tabler/icons-react';

interface Props {
  token:     string;
  showToast: (msg: string, type?: string) => void;
}

const STATUS_LABELS: Record<PlayerStatus, string> = {
  pending:  'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const FILTER_LABELS: Record<PlayerFilter, string> = {
  pending:  'Pendentes',
  approved: 'Aprovados',
  rejected: 'Rejeitados',
  blocked:  'Bloqueados',
  deleted:  'Excluídos',
  all:      'Todos',
};

export function PendingPlayers({ token, showToast }: Props) {
  const [players,         setPlayers]         = useState<Player[]>([]);
  const [filter,          setFilter]          = useState<PlayerFilter>('pending');
  const [loading,         setLoading]         = useState(false);
  const [updating,        setUpdating]        = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetPlayers(token, filter);
      setPlayers(data);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, filter, showToast]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  async function handleStatus(id: number, status: 'approved' | 'rejected') {
    setUpdating(id);
    try {
      await apiUpdatePlayerStatus(token, id, status);
      showToast(status === 'approved' ? 'Jogador aprovado!' : 'Jogador rejeitado.', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleBlock(id: number) {
    setUpdating(id);
    try {
      await apiBlockPlayer(token, id);
      showToast('Jogador bloqueado.', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleUnblock(id: number) {
    setUpdating(id);
    try {
      await apiUnblockPlayer(token, id);
      showToast('Jogador desbloqueado!', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  function handleDelete(id: number) {
    setConfirmDeleteId(id);
  }

  async function doDelete(id: number) {
    setConfirmDeleteId(null);
    setUpdating(id);
    try {
      await apiDeletePlayer(token, id);
      showToast('Jogador excluído do rank.', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleRestore(id: number) {
    setUpdating(id);
    try {
      await apiRestorePlayer(token, id);
      showToast('Jogador restaurado!', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  const filterOptions: PlayerFilter[] = ['pending', 'approved', 'rejected', 'blocked', 'deleted', 'all'];
  const pendingCount = players.filter(p => p.status === 'pending').length;
  const isDeleted    = filter === 'deleted';

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2>
          <IconUsers size={18} /> Jogadores Cadastrados
          {filter === 'pending' && pendingCount > 0 && (
            <span className="painel-pending-badge">{pendingCount}</span>
          )}
        </h2>
      </div>

      <div className="painel-section-filter">
        <div className="filter-bar">
          {filterOptions.map(f => (
            <button key={f}
              className={`sort-btn${filter === f ? ' active' : ''}${f === 'blocked' ? ' filter-blocked' : ''}${f === 'deleted' ? ' filter-deleted' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'pending'  && <IconClock   size={16} />}
              {f === 'approved' && <IconCheck   size={16} />}
              {f === 'rejected' && <IconX       size={16} />}
              {f === 'blocked'  && <IconLock    size={16} />}
              {f === 'deleted'  && <IconTrash   size={16} />}
              {f === 'all'      && <IconList    size={16} />}
              {' '}{FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {isDeleted && (
        <div className="painel-deleted-banner">
          <IconInfoCircle size={16} />
          Jogadores excluídos ficam ocultos do rank público. Clique em Restaurar para reativar.
        </div>
      )}

      {loading && (
        <div className="painel-loading-row">
          <IconLoader2 size={16} className="animate-spin" /> Carregando jogadores...
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="painel-empty-state">
          <IconUserOff size={20} />
          <p>Nenhum jogador {filter !== 'all' ? FILTER_LABELS[filter].toLowerCase() : ''} encontrado.</p>
        </div>
      )}

      <div className="players-list">
        {players.map(p => (
          <div key={p.id} className={`player-card status-${p.status}${p.blocked ? ' player-blocked' : ''}${p.deleted_at ? ' player-deleted' : ''}`}>
            <div className="player-card-info">
              <span className="player-nick">{p.nick}</span>
              <div className="player-badges">
                {!isDeleted && (
                  <span className={`player-status status-badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                )}
                {p.blocked && !isDeleted && (
                  <span className="player-status status-badge-blocked"><IconLock size={16} /> Bloqueado</span>
                )}
                {isDeleted && (
                  <span className="player-status status-badge-deleted"><IconTrash size={16} /> Excluído</span>
                )}
              </div>
            </div>

            <div className="player-card-links">
              {p.twitch_url  && <a href={p.twitch_url}  target="_blank" rel="noopener noreferrer" title="Twitch"><IconBrandTwitch  size={16} /></a>}
              {p.youtube_url && <a href={p.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube"><IconBrandYoutube size={16} /></a>}
              {p.kick_url    && <a href={p.kick_url}    target="_blank" rel="noopener noreferrer" title="Kick"><IconBrandKick    size={16} /></a>}
              {p.tiktok_url  && <a href={p.tiktok_url}  target="_blank" rel="noopener noreferrer" title="TikTok"><IconBrandTiktok  size={16} /></a>}
            </div>

            <div className="player-card-actions">
              {isDeleted ? (
                <button className="btn-success btn-sm" disabled={updating === p.id}
                  onClick={() => handleRestore(p.id)}>
                  <IconRefresh size={16} /> Restaurar
                </button>
              ) : (
                <>
                  {p.status !== 'approved' && (
                    <button className="btn-success btn-sm" disabled={updating === p.id}
                      onClick={() => handleStatus(p.id, 'approved')}>
                      <IconCheck size={16} /> Aprovar
                    </button>
                  )}
                  {p.status !== 'rejected' && (
                    <button className="btn-danger btn-sm" disabled={updating === p.id}
                      onClick={() => handleStatus(p.id, 'rejected')}>
                      <IconX size={16} /> Rejeitar
                    </button>
                  )}
                  {!p.blocked ? (
                    <button className="btn-warning btn-sm" disabled={updating === p.id}
                      onClick={() => handleBlock(p.id)}>
                      <IconLock size={16} /> Bloquear
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" disabled={updating === p.id}
                      onClick={() => handleUnblock(p.id)}>
                      <IconLockOpen size={16} /> Desbloquear
                    </button>
                  )}
                  <button className="btn-ghost btn-sm btn-delete" disabled={updating === p.id}
                    title="Excluir jogador do rank"
                    onClick={() => handleDelete(p.id)}>
                    <IconTrash size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {confirmDeleteId !== null && (
        <ConfirmModal
          title="Excluir jogador"
          message="O progresso deste jogador será removido do ranking público. Esta ação pode ser desfeita restaurando o jogador na aba Excluídos."
          confirmLabel="Excluir"
          danger
          onConfirm={() => doDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}