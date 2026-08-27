import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetPlayers, apiUpdatePlayerStatus, apiBlockPlayer, apiUnblockPlayer, apiDeletePlayer, apiRestorePlayer, apiSetPlayerEmail, apiVerifyPlayerEmail, apiSetFeaturedStreamer } from '../../lib/api';
import type { Player, PlayerStatus, PlayerFilter } from '../../types';
import { ConfirmModal } from './ConfirmModal';
import { EditLinksModal } from './EditLinksModal';
import { Pagination } from '../Pagination';

const PAGE_SIZE = 20;

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
  blocked:   'Banidos',
  deleted:   'Excluídos',
  supporter: 'Apoiadores',
  all:       'Todos',
};

const BAN_REASONS = [
  'Trapaça / Cheat',
  'Assédio / Comportamento tóxico',
  'Jogo em modo Sandbox',
  'Múltiplas contas',
  'Identidade falsa / Fraude',
  'Violação das regras do campeonato',
  'Outro motivo',
];

interface BanModalProps {
  nick:      string;
  onConfirm: (reason: string, note: string) => void;
  onCancel:  () => void;
}

function BanModal({ nick, onConfirm, onCancel }: BanModalProps) {
  const [reason, setReason] = useState('');
  const [note,   setNote]   = useState('');

  useEffect(() => {
    const prev  = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  return (
    <div className="modal-overlay active" role="alertdialog" aria-modal="true">
      <div className="modal-box modal-box--sm ban-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onCancel}>
          <i className="ti ti-x" />
        </button>

        <h2 className="modal-title">
          <i className="ti ti-ban" /> Banir jogador
        </h2>

        <div className="ban-modal-body">
          <p className="ban-modal-nick">
            Banindo: <strong>{nick}</strong>
          </p>

          <div className="ban-modal-field">
            <label className="form-label" htmlFor="ban-reason">
              Motivo do banimento <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <select
              id="ban-reason"
              className="form-input ban-reason-select"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="">Selecione um motivo...</option>
              {BAN_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="ban-modal-field">
            <label className="form-label" htmlFor="ban-note">
              Observação adicional <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              id="ban-note"
              className="form-input ban-note-textarea"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Detalhes adicionais, links de evidência..."
              rows={3}
            />
          </div>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            disabled={!reason}
            onClick={() => onConfirm(reason, note)}
          >
            <i className="ti ti-ban" /> Confirmar banimento
          </button>
        </div>
      </div>
    </div>
  );
}

export function PendingPlayers({ token, showToast }: Props) {
  const [players,         setPlayers]         = useState<Player[]>([]);
  const [filter,          setFilter]          = useState<PlayerFilter>('pending');
  const [search,          setSearch]          = useState('');
  const [page,            setPage]            = useState(1);
  const [loading,         setLoading]         = useState(false);
  const [updating,        setUpdating]        = useState<number | null>(null);
  const [banTargetId,     setBanTargetId]     = useState<number | null>(null);
  const [unbanTargetId,   setUnbanTargetId]   = useState<number | null>(null);
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
  useEffect(() => { setPage(1); }, [filter, search]);

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => p.nick.toLowerCase().includes(q));
  }, [players, search]);

  const totalPages     = Math.max(1, Math.ceil(visiblePlayers.length / PAGE_SIZE));
  const safePage        = Math.min(page, totalPages);
  const paginatedPlayers = visiblePlayers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  async function handleBanConfirm(reason: string, note: string) {
    const id = banTargetId!;
    setBanTargetId(null);
    setUpdating(id);
    try {
      await apiBlockPlayer(token, id, reason, note || undefined);
      showToast('Jogador banido.', 'success');
      fetchPlayers();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleUnban(id: number) {
    setUnbanTargetId(null);
    setUpdating(id);
    try {
      await apiUnblockPlayer(token, id);
      showToast('Jogador desbanido!', 'success');
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

  async function handleCopyOverlayLink(p: Player) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/overlay/${p.id}`);
      showToast('Link do overlay copiado!', 'success');
    } catch {
      showToast('Não foi possível copiar o link.', 'error');
    }
  }

  async function handleToggleFeaturedStreamer(p: Player) {
    const next = !p.is_featured_streamer;
    setUpdating(p.id);
    try {
      await apiSetFeaturedStreamer(token, p.id, next);
      setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, is_featured_streamer: next } : x));
      showToast(next ? 'Destaque de streamer definido.' : 'Destaque de streamer removido.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdating(null);
    }
  }

  const filterOptions: PlayerFilter[] = ['pending', 'approved', 'rejected', 'blocked', 'deleted', 'all'];
  const pendingCount = players.filter(p => p.status === 'pending').length;
  const isDeleted    = filter === 'deleted';
  const unbanTarget  = unbanTargetId !== null ? players.find(p => p.id === unbanTargetId) : null;
  const banTarget    = banTargetId   !== null ? players.find(p => p.id === banTargetId)   : null;

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
              {f === 'blocked'  && <i className="ti ti-ban" />}
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
        {paginatedPlayers.map(p => (
          <div key={p.id} className={`player-card status-${p.status}${p.blocked ? ' player-blocked' : ''}${p.deleted_at ? ' player-deleted' : ''}`}>
            <div className="player-card-info">
              <span className="player-nick">{p.nick}</span>
              <div className="player-badges">
                {!isDeleted && (
                  <span className={`player-status status-badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                )}
                {p.blocked && !isDeleted && (
                  <span className="player-status status-badge-blocked"><i className="ti ti-ban" /> Banido</span>
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

            {/* Informações do banimento */}
            {p.blocked && p.blocked_reason && (
              <div className="player-ban-info">
                <i className="ti ti-ban" />
                <span>Motivo: <strong>{p.blocked_reason}</strong></span>
                {p.blocked_by && <span className="player-ban-sep">•</span>}
                {p.blocked_by && <span>por <strong>{p.blocked_by}</strong></span>}
                {p.blocked_at && <span className="player-ban-sep">•</span>}
                {p.blocked_at && (
                  <span>{new Date(p.blocked_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                )}
                {p.blocked_note && (
                  <div className="player-ban-note">{p.blocked_note}</div>
                )}
              </div>
            )}

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
                      title="Banir jogador"
                      onClick={() => setBanTargetId(p.id)}>
                      <i className="ti ti-ban" /> Banir
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" disabled={updating === p.id}
                      title="Remover banimento"
                      onClick={() => setUnbanTargetId(p.id)}>
                      <i className="ti ti-lock-open" /> Desbanir
                    </button>
                  )}
                  <button className="btn-ghost btn-sm" disabled={updating === p.id}
                    title="Editar links de canais"
                    onClick={() => setEditLinksPlayer(p)}>
                    <i className="ti ti-link" />
                  </button>
                  <button
                    className={`btn-sm${p.is_featured_streamer ? ' btn-test-mod-active' : ' btn-secondary'}`}
                    disabled={updating === p.id}
                    title={p.is_featured_streamer ? 'Remover destaque de streamer oficial' : 'Definir como streamer oficial (aparece em destaque na home)'}
                    onClick={() => handleToggleFeaturedStreamer(p)}>
                    <i className="ti ti-star" /> Streamer
                  </button>
                  {p.is_featured_streamer && (
                    <button className="btn-ghost btn-sm"
                      title="Copiar link do overlay pra OBS"
                      onClick={() => handleCopyOverlayLink(p)}>
                      <i className="ti ti-copy" /> Overlay
                    </button>
                  )}
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

      <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />

      {/* Modal de banimento */}
      {banTargetId !== null && banTarget && (
        <BanModal
          nick={banTarget.nick}
          onConfirm={handleBanConfirm}
          onCancel={() => setBanTargetId(null)}
        />
      )}

      {/* Confirmação de desbanimento */}
      {unbanTargetId !== null && unbanTarget && (
        <ConfirmModal
          title="Remover banimento"
          message={`Deseja realmente desbanir ${unbanTarget.nick}? O jogador poderá enviar dados do jogo novamente.`}
          confirmLabel="Confirmar desbanimento"
          onConfirm={() => handleUnban(unbanTargetId)}
          onCancel={() => setUnbanTargetId(null)}
        />
      )}

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
