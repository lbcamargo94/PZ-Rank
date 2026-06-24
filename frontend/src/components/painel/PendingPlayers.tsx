import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGetPlayers, apiUpdatePlayerStatus, apiBlockPlayer, apiUnblockPlayer, apiDeletePlayer, apiRestorePlayer } from '../../lib/api';
import type { Player, PlayerStatus, PlayerFilter } from '../../types';
import { ConfirmModal } from './ConfirmModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  token: string;
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

const FILTER_ICONS: Record<PlayerFilter, React.ReactElement> = {
  pending:  <IconClock  size={16} />,
  approved: <IconCheck  size={16} />,
  rejected: <IconX      size={16} />,
  blocked:  <IconLock   size={16} />,
  deleted:  <IconTrash  size={16} />,
  all:      <IconList   size={16} />,
};

export function PendingPlayers({ token }: Props) {
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
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  async function handleStatus(id: number, status: 'approved' | 'rejected') {
    setUpdating(id);
    try {
      await apiUpdatePlayerStatus(token, id, status);
      toast.success(status === 'approved' ? 'Jogador aprovado!' : 'Jogador rejeitado.');
      fetchPlayers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  async function handleBlock(id: number) {
    setUpdating(id);
    try {
      await apiBlockPlayer(token, id);
      toast.success('Jogador bloqueado.');
      fetchPlayers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  async function handleUnblock(id: number) {
    setUpdating(id);
    try {
      await apiUnblockPlayer(token, id);
      toast.success('Jogador desbloqueado!');
      fetchPlayers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  async function doDelete(id: number) {
    setConfirmDeleteId(null);
    setUpdating(id);
    try {
      await apiDeletePlayer(token, id);
      toast.success('Jogador excluído do rank.');
      fetchPlayers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  async function handleRestore(id: number) {
    setUpdating(id);
    try {
      await apiRestorePlayer(token, id);
      toast.success('Jogador restaurado!');
      fetchPlayers();
    } catch (err) {
      toast.error((err as Error).message);
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
            <Badge variant="pending" className="ml-2">{pendingCount}</Badge>
          )}
        </h2>
      </div>

      <div className="painel-section-filter">
        <div className="filter-bar">
          {filterOptions.map(f => (
            <Button key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}>
              {FILTER_ICONS[f]} {FILTER_LABELS[f]}
            </Button>
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
                  <Badge variant={p.status as 'pending' | 'approved' | 'rejected'}>
                    {STATUS_LABELS[p.status]}
                  </Badge>
                )}
                {p.blocked && !isDeleted && (
                  <Badge variant="blocked"><IconLock size={14} /> Bloqueado</Badge>
                )}
                {isDeleted && (
                  <Badge variant="deleted"><IconTrash size={14} /> Excluído</Badge>
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
                <Button variant="success" size="sm" disabled={updating === p.id}
                  onClick={() => handleRestore(p.id)}>
                  <IconRefresh size={16} /> Restaurar
                </Button>
              ) : (
                <>
                  {p.status !== 'approved' && (
                    <Button variant="success" size="sm" disabled={updating === p.id}
                      onClick={() => handleStatus(p.id, 'approved')}>
                      <IconCheck size={16} /> Aprovar
                    </Button>
                  )}
                  {p.status !== 'rejected' && (
                    <Button variant="destructive" size="sm" disabled={updating === p.id}
                      onClick={() => handleStatus(p.id, 'rejected')}>
                      <IconX size={16} /> Rejeitar
                    </Button>
                  )}
                  {!p.blocked ? (
                    <Button variant="warning" size="sm" disabled={updating === p.id}
                      onClick={() => handleBlock(p.id)}>
                      <IconLock size={16} /> Bloquear
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled={updating === p.id}
                      onClick={() => handleUnblock(p.id)}>
                      <IconLockOpen size={16} /> Desbloquear
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" disabled={updating === p.id}
                    title="Excluir jogador do rank"
                    onClick={() => setConfirmDeleteId(p.id)}>
                    <IconTrash size={16} />
                  </Button>
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