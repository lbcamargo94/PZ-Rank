import { useState, useEffect, useCallback } from 'react';
import { apiGetPlayers, apiUpdatePlayerStatus } from '../../lib/api';
import type { Player, PlayerStatus } from '../../types';

interface Props {
  token:     string;
  showToast: (msg: string, type?: string) => void;
}

const STATUS_LABELS: Record<PlayerStatus, string> = {
  pending:  'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export function PendingPlayers({ token, showToast }: Props) {
  const [players,   setPlayers]   = useState<Player[]>([]);
  const [filter,    setFilter]    = useState<PlayerStatus | 'all'>('pending');
  const [loading,   setLoading]   = useState(false);
  const [updating,  setUpdating]  = useState<number | null>(null);

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

  const filterOptions: Array<PlayerStatus | 'all'> = ['pending', 'approved', 'rejected', 'all'];

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2>Jogadores Cadastrados</h2>
        <div className="filter-bar">
          {filterOptions.map(f => (
            <button key={f}
              className={`sort-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="painel-loading">Carregando...</p>}

      {!loading && players.length === 0 && (
        <p className="painel-empty">Nenhum jogador {filter !== 'all' ? STATUS_LABELS[filter].toLowerCase() : ''} encontrado.</p>
      )}

      {players.map(p => (
        <div key={p.id} className={`player-card status-${p.status}`}>
          <div className="player-card-info">
            <span className="player-nick">{p.nick}</span>
            <span className={`player-status status-badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
          </div>
          <div className="player-card-links">
            {p.twitch_url  && <a href={p.twitch_url}  target="_blank" rel="noopener noreferrer"><i className="ti ti-brand-twitch" /></a>}
            {p.youtube_url && <a href={p.youtube_url} target="_blank" rel="noopener noreferrer"><i className="ti ti-brand-youtube" /></a>}
            {p.kick_url    && <a href={p.kick_url}    target="_blank" rel="noopener noreferrer"><i className="ti ti-brand-kick" /></a>}
            {p.tiktok_url  && <a href={p.tiktok_url}  target="_blank" rel="noopener noreferrer"><i className="ti ti-brand-tiktok" /></a>}
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
          </div>
        </div>
      ))}
    </div>
  );
}
