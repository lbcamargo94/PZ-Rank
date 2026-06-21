import { useState, useEffect, useCallback } from 'react';
import { apiGetPlayers, apiUpdatePlayerStatus, apiBlockPlayer, apiUnblockPlayer } from '../../lib/api';
import type { Player, PlayerStatus, PlayerFilter } from '../../types';

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
  pending:  'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  blocked:  'Bloqueados',
  all:      'Todos',
};

export function PendingPlayers({ token, showToast }: Props) {
  const [players,  setPlayers]  = useState<Player[]>([]);
  const [filter,   setFilter]   = useState<PlayerFilter>('pending');
  const [loading,  setLoading]  = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

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

  const filterOptions: PlayerFilter[] = ['pending', 'approved', 'rejected', 'blocked', 'all'];

  const pendingCount  = players.filter(p => p.status === 'pending').length;

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2>
          <i className="ti ti-users" /> Jogadores Cadastrados
          {filter === 'pending' && pendingCount > 0 && (
            <span className="painel-pending-badge">{pendingCount}</span>
          )}
        </h2>
        <div className="filter-bar">
          {filterOptions.map(f => (
            <button key={f}
              className={`sort-btn${filter === f ? ' active' : ''}${f === 'blocked' ? ' filter-blocked' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'pending'  && <i className="ti ti-clock" />}
              {f === 'approved' && <i className="ti ti-check" />}
              {f === 'rejected' && <i className="ti ti-x" />}
              {f === 'blocked'  && <i className="ti ti-lock" />}
              {f === 'all'      && <i className="ti ti-list" />}
              {' '}{FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="painel-loading-row">
          <i className="ti ti-loader-2 spin" /> Carregando jogadores...
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="painel-empty-state">
          <i className="ti ti-user-off" />
          <p>Nenhum jogador {filter !== 'all' ? FILTER_LABELS[filter].toLowerCase() : ''} encontrado.</p>
        </div>
      )}

      <div className="players-list">
        {players.map(p => (
          <div key={p.id} className={`player-card status-${p.status}${p.blocked ? ' player-blocked' : ''}`}>
            <div className="player-card-info">
              <span className="player-nick">{p.nick}</span>
              <div className="player-badges">
                <span className={`player-status status-badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                {p.blocked && <span className="player-status status-badge-blocked"><i className="ti ti-lock" /> Bloqueado</span>}
              </div>
            </div>

            <div className="player-card-links">
              {p.twitch_url  && <a href={p.twitch_url}  target="_blank" rel="noopener noreferrer" title="Twitch"><i className="ti ti-brand-twitch" /></a>}
              {p.youtube_url && <a href={p.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube"><i className="ti ti-brand-youtube" /></a>}
              {p.kick_url    && <a href={p.kick_url}    target="_blank" rel="noopener noreferrer" title="Kick"><i className="ti ti-brand-kick" /></a>}
              {p.tiktok_url  && <a href={p.tiktok_url}  target="_blank" rel="noopener noreferrer" title="TikTok"><i className="ti ti-brand-tiktok" /></a>}
            </div>

            <div className="player-card-actions">
              {p.status !== 'approved' && (
                <button className="btn-success btn-sm" disabled={updating === p.id}
                  onClick={() => handleStatus(p.id, 'approved')}>
                  <i className="ti ti-check" /> Aprovar
                </button>
              )}
              {p.status !== 'rejected' && (
                <button className="btn-danger btn-sm" disabled={updating === p.id}
                  onClick={() => handleStatus(p.id, 'rejected')}>
                  <i className="ti ti-x" /> Rejeitar
                </button>
              )}
              {!p.blocked ? (
                <button className="btn-warning btn-sm" disabled={updating === p.id}
                  onClick={() => handleBlock(p.id)}>
                  <i className="ti ti-lock" /> Bloquear
                </button>
              ) : (
                <button className="btn-ghost btn-sm" disabled={updating === p.id}
                  onClick={() => handleUnblock(p.id)}>
                  <i className="ti ti-lock-open" /> Desbloquear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
