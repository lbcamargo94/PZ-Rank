import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetPlayers, apiUpdatePlayerStatus, apiBlockPlayer, apiUnblockPlayer, apiDeletePlayer, apiRestorePlayer, apiSetPlayerEmail, apiVerifyPlayerEmail } from '../../lib/api';
import type { Player, PlayerStatus, PlayerFilter } from '../../types';
import { ConfirmModal } from './ConfirmModal';
import { EditLinksModal } from './EditLinksModal';

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
  pending:   'Pendentes',
  approved:  'Aprovados',
  rejected:  'Rejeitados',
  blocked:   'Bloqueados',
  deleted:   'Excluídos',
  supporter: 'Apoiadores',
  all:       'Todos',
};

export function PendingPlayers({ token, showToast }: Props) {
  const [players,         setPlayers]         = useState<Player[]>([]);
  const [filter,          setFilter]          = useState<PlayerFilter>('pending');
  const [search,          setSearch]          = useState('');
  const [loading,         setLoading]         = useState(false);
  const [updating,        setUpdating]        = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editLinksPlayer, setEditLinksPlayer] = useState<Player | null>(null);
  const [emailInputs,     setEmailInputs]     = useState<Record<number, string>>({});
  const [sendingEmail,    setSendingEmail]    = useState<number | null>(null);
  const [verifyingEmail,  setVerifyingEmail]  = useState<number | null>(null);

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
  useEffect(() => { setSearch(''); }, [filter]);

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => p.nick.toLowerCase().includes(q));
  }, [players, search]);

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

  async function handleSendActivation(id: number) {
    const email = (emailInputs[id] ?? '').trim();
    if (!email) { showToast('Digite um email válido.', 'error'); return; }
    setSendingEmail(id);
    try {
      await apiSetPlayerEmail(token, id, email);
      showToast('Email de ativação enviado!', 'success');
      setEmailInputs(prev => { const n = { ...prev }; delete n[id]; return n; });
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSendingEmail(null);
    }
  }

  async function handleResendActivation(id: number, email: string) {
    setSendingEmail(id);
    try {
      await apiSetPlayerEmail(token, id, email);
      showToast('Email de ativação reenviado!', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSendingEmail(null);
    }
  }

  async function handleVerifyEmail(id: number) {
    setVerifyingEmail(id);
    try {
      await apiVerifyPlayerEmail(token, id);
      showToast('Email verificado manualmente!', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setVerifyingEmail(null);
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
          <i className="ti ti-users" /> Jogadores Cadastrados
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
              {f === 'pending'  && <i className="ti ti-clock" />}
              {f === 'approved' && <i className="ti ti-check" />}
              {f === 'rejected' && <i className="ti ti-x" />}
              {f === 'blocked'  && <i className="ti ti-lock" />}
              {f === 'deleted'  && <i className="ti ti-trash" />}
              {f === 'all'      && <i className="ti ti-list" />}
              {' '}{FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="painel-search-bar">
          <i className="ti ti-search" />
          <input
            type="text"
            placeholder={`Buscar em ${FILTER_LABELS[filter].toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="painel-search-clear" onClick={() => setSearch('')} title="Limpar busca">
              <i className="ti ti-x" />
            </button>
          )}
        </div>
      </div>

      {isDeleted && (
        <div className="painel-deleted-banner">
          <i className="ti ti-info-circle" />
          Jogadores excluídos ficam ocultos do rank público. Clique em Restaurar para reativar.
        </div>
      )}

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

      {!loading && players.length > 0 && visiblePlayers.length === 0 && (
        <div className="painel-empty-state">
          <i className="ti ti-search-off" />
          <p>Nenhum resultado para "<strong>{search}</strong>".</p>
        </div>
      )}

      <div className="players-list">
        {visiblePlayers.map(p => (
          <div key={p.id} className={`player-card status-${p.status}${p.blocked ? ' player-blocked' : ''}${p.deleted_at ? ' player-deleted' : ''}`}>
            <div className="player-card-info">
              <span className="player-nick">{p.nick}</span>
              <div className="player-badges">
                {!isDeleted && (
                  <span className={`player-status status-badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                )}
                {p.blocked && !isDeleted && (
                  <span className="player-status status-badge-blocked"><i className="ti ti-lock" /> Bloqueado</span>
                )}
                {isDeleted && (
                  <span className="player-status status-badge-deleted"><i className="ti ti-trash" /> Excluído</span>
                )}
                {p.email && p.email_verified_at && (
                  <span className="player-status status-badge-email-ok" title={`Email verificado: ${p.email}`}>
                    <i className="ti ti-mail-check" /> Email OK
                  </span>
                )}
                {p.email && !p.email_verified_at && (
                  <span className="player-status status-badge-email-pending" title={`Aguardando verificação: ${p.email}`}>
                    <i className="ti ti-mail-off" /> Email pendente
                  </span>
                )}
                {!p.email && (
                  <span className="player-status status-badge-email-none" title="Cadastrado sem email (conta legada)">
                    <i className="ti ti-mail-x" /> Sem email
                  </span>
                )}
              </div>
            </div>

            <div className="player-card-links">
              {p.twitch_url  && <a href={p.twitch_url}  target="_blank" rel="noopener noreferrer" title="Twitch"><i className="ti ti-brand-twitch" /></a>}
              {p.youtube_url && <a href={p.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube"><i className="ti ti-brand-youtube" /></a>}
              {p.kick_url    && <a href={p.kick_url}    target="_blank" rel="noopener noreferrer" title="Kick"><i className="ti ti-brand-kick" /></a>}
              {p.tiktok_url  && <a href={p.tiktok_url}  target="_blank" rel="noopener noreferrer" title="TikTok"><i className="ti ti-brand-tiktok" /></a>}
            </div>

            <div className="player-card-actions">
              {isDeleted ? (
                <button className="btn-success btn-sm" disabled={updating === p.id}
                  onClick={() => handleRestore(p.id)}>
                  <i className="ti ti-refresh" /> Restaurar
                </button>
              ) : (
                <>
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
                  <button className="btn-ghost btn-sm" disabled={updating === p.id}
                    title="Editar links de canais"
                    onClick={() => setEditLinksPlayer(p)}>
                    <i className="ti ti-link" />
                  </button>
                  <button className="btn-ghost btn-sm btn-delete" disabled={updating === p.id}
                    title="Excluir jogador do rank"
                    onClick={() => handleDelete(p.id)}>
                    <i className="ti ti-trash" />
                  </button>
                </>
              )}
            </div>

            {!isDeleted && (
              <div className="player-card-email-row">
                {!p.email ? (
                  <>
                    <input
                      type="email"
                      className="player-email-input"
                      placeholder="email@exemplo.com"
                      value={emailInputs[p.id] ?? ''}
                      onChange={e => setEmailInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendActivation(p.id); }}
                    />
                    <button
                      className="btn-ghost btn-sm"
                      disabled={sendingEmail === p.id || !emailInputs[p.id]?.trim()}
                      onClick={() => handleSendActivation(p.id)}
                      title="Enviar email de ativação"
                    >
                      <i className="ti ti-send" />
                      {sendingEmail === p.id ? ' Enviando...' : ' Enviar ativação'}
                    </button>
                  </>
                ) : !p.email_verified_at ? (
                  <>
                    <button
                      className="btn-success btn-sm"
                      disabled={verifyingEmail === p.id}
                      onClick={() => handleVerifyEmail(p.id)}
                      title={`Verificar email manualmente: ${p.email}`}
                    >
                      <i className="ti ti-mail-check" />
                      {verifyingEmail === p.id ? ' Verificando...' : ' Verificar email'}
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      disabled={sendingEmail === p.id}
                      onClick={() => handleResendActivation(p.id, p.email!)}
                      title={`Reenviar ativação para ${p.email}`}
                    >
                      <i className="ti ti-send" />
                      {sendingEmail === p.id ? ' Enviando...' : ' Reenviar ativação'}
                    </button>
                  </>
                ) : null}
              </div>
            )}
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

      {editLinksPlayer !== null && (
        <EditLinksModal
          player={editLinksPlayer}
          token={token}
          onClose={() => setEditLinksPlayer(null)}
          onSuccess={updated => setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p))}
          showToast={showToast}
        />
      )}
    </div>
  );
}