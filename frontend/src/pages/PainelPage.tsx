import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiLogout, apiDeleteEntry, apiGetEntries, apiUpdateEntryStatus, apiSetTestMod, apiConfirmDeath } from '../lib/api';
import type { Entry, SortKey } from '../types';
import type { ModSession } from '../types';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { PainelLogin }           from '../components/painel/PainelLogin';
import { PendingPlayers }        from '../components/painel/PendingPlayers';
import { UpdateRankModal }       from '../components/painel/UpdateRankModal';
import { EditObjectivesModal }   from '../components/painel/EditObjectivesModal';
import { ModeratorsList }        from '../components/painel/ModeratorsList';
import { InviteModeratorModal }  from '../components/painel/InviteModeratorModal';
import { ConfirmModal }          from '../components/painel/ConfirmModal';
import { CodeDecoder }           from '../components/painel/CodeDecoder';
import { SandboxPage }          from '../components/painel/SandboxPage';
import { ModManagement }        from '../components/painel/ModManagement';
import { SeasonManager }        from '../components/painel/SeasonManager';
import { NewsManager }          from '../components/painel/NewsManager';
import { FinancesManager }      from '../components/painel/FinancesManager';

const DEAD_ZONE_DAYS   = 15;
const PAINEL_PAGE_SIZE = 20;

function isInDeadZone(entry: Entry): boolean {
  if (entry.sandbox_ok !== false) return false;
  if (!entry.disqualified_at) return false;
  const ms = Date.now() - new Date(entry.disqualified_at).getTime();
  return ms > DEAD_ZONE_DAYS * 24 * 60 * 60 * 1000;
}


function fmtEntryDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear() + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

type Tab         = 'players' | 'entries' | 'moderators' | 'mods' | 'decoder' | 'seasons' | 'jornal' | 'financas';
type EntryFilter = 'all' | 'alive' | 'dead' | 'disqualified' | 'conflicts';

const ENTRY_FILTER_CONFIG: { key: EntryFilter; label: string; icon: string }[] = [
  { key: 'all',          label: 'Todos',           icon: 'ti-list'           },
  { key: 'alive',        label: 'Vivos',            icon: 'ti-heartbeat'      },
  { key: 'dead',         label: 'Mortos',           icon: 'ti-skull'          },
  { key: 'disqualified', label: 'Desclassificados', icon: 'ti-ban'            },
  { key: 'conflicts',    label: 'Conflitos',        icon: 'ti-alert-triangle' },
];

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

const DISQ_INFO: Record<string, { icon: string; label: string; detail: string; color: string }> = {
  sandbox:     { icon: 'ti-adjustments-off', label: 'Sandbox modificado',     detail: 'As configurações do sandbox divergem do preset oficial do desafio.',  color: '#f59e0b' },
  debug:       { icon: 'ti-bug',             label: 'Modo debug ativo',       detail: 'O jogador ativou o modo debug durante o desafio Brasileirão.',         color: '#ef4444' },
  mods:        { icon: 'ti-puzzle-off',      label: 'Mods não permitidos',    detail: 'Mod(s) fora da whitelist detectado(s) durante o desafio.',             color: '#ef4444' },
  manual:      { icon: 'ti-user-x',          label: 'Desclassificação manual',detail: 'Desclassificado manualmente por um moderador.',                        color: '#6b7280' },
  mod_removed: { icon: 'ti-plug-off',        label: 'Mod removido',           detail: 'O Companion detectou que o mod foi removido enquanto o jogo rodava.',  color: '#ef4444' },
};

const ANOMALY_INFO: Record<string, { label: string; detail: string }> = {
  kills_regression: { label: 'Regressão de kills',              detail: 'O total de kills diminuiu entre dois syncs — impossível legitimamente.' },
  days_regression:  { label: 'Regressão de dias sobrevividos',  detail: 'Os dias sobrevividos diminuíram entre dois syncs.' },
  kills_spike:      { label: 'Ritmo de kills impossível',       detail: 'Mais de 2 kills/segundo registrados entre syncs — inatingível no PZ.' },
  code_replay:      { label: 'Replay de código antigo',         detail: 'O timestamp do código é anterior ao último sync gravado — possível reenvio de código desatualizado.' },
};

// Mod não permitido detectado pelo próprio mod Lua (checagem contra a whitelist) — não
// desclassifica sozinho, só avisa o moderador. Formato dinâmico "unauthorized_mod:<Nome>",
// por isso não cabe no dicionário estático ANOMALY_INFO acima.
function unauthorizedModAnomaly(flaggedReason: string): { label: string; detail: string } | null {
  if (!flaggedReason.startsWith('unauthorized_mod')) return null;
  const modName = flaggedReason.startsWith('unauthorized_mod:') ? flaggedReason.slice('unauthorized_mod:'.length) : '';
  return {
    label:  'Mod não permitido detectado',
    detail: modName
      ? `O mod "${modName}" não está na whitelist do campeonato. Não foi desclassificado automaticamente — revise e decida manualmente.`
      : 'Um mod fora da whitelist foi detectado, mas o código não trouxe o nome. Não foi desclassificado automaticamente — revise e decida manualmente.',
  };
}

function DisqDetail({ entry }: { entry: Entry }) {
  const hasDisq   = entry.sandbox_ok === false;
  const hasAnomaly = !!entry.flagged_reason;
  if (!hasDisq && !hasAnomaly) return null;

  const disq    = DISQ_INFO[entry.disqualification_reason ?? 'sandbox'] ?? DISQ_INFO.sandbox;
  const anomaly = entry.flagged_reason
    ? (unauthorizedModAnomaly(entry.flagged_reason) ?? ANOMALY_INFO[entry.flagged_reason] ?? { label: entry.flagged_reason, detail: '' })
    : null;

  return (
    <div className="painel-disq-detail">
      {hasDisq && (
        <div className="painel-disq-row" style={{ '--dc': disq.color } as React.CSSProperties}>
          <i className={`ti ${disq.icon} painel-disq-icon`} />
          <div className="painel-disq-text">
            <span className="painel-disq-label">{disq.label}</span>
            <span className="painel-disq-desc">{disq.detail}</span>
            {entry.disqualification_note && (
              <span className="painel-disq-note">
                “{entry.disqualification_note}”
                {entry.disqualified_by && <> — <strong>{entry.disqualified_by}</strong></>}
              </span>
            )}
          </div>
          {entry.disqualified_at && (
            <span className="painel-disq-date"><i className="ti ti-clock" /> {fmtEntryDate(entry.disqualified_at)}</span>
          )}
        </div>
      )}
      {anomaly && (
        <div className="painel-disq-row painel-disq-row--anomaly">
          <i className="ti ti-alert-triangle painel-disq-icon" />
          <div className="painel-disq-text">
            <span className="painel-disq-label">Anomalia: {anomaly.label}</span>
            {anomaly.detail && <span className="painel-disq-desc">{anomaly.detail}</span>}
          </div>
          {entry.flagged_at && (
            <span className="painel-disq-date"><i className="ti ti-clock" /> {fmtEntryDate(entry.flagged_at)}</span>
          )}
        </div>
      )}
    </div>
  );
}

const DISQUALIFY_REASONS = [
  'Trapaça / Cheat',
  'Uso de mods não permitidos (não detectado automaticamente)',
  'Configuração de sandbox suspeita',
  'Comportamento antidesportivo',
  'Violação das regras do campeonato',
  'Suspeita de múltiplas contas',
  'Outro motivo',
];

interface DisqualifyModalProps {
  entry:     Entry;
  onConfirm: (note: string) => void;
  onCancel:  () => void;
}

function DisqualifyModal({ entry, onConfirm, onCancel }: DisqualifyModalProps) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    const prev  = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  function handleConfirm() {
    const note = detail.trim() ? `${reason}: ${detail.trim()}` : reason;
    onConfirm(note);
  }

  return (
    <div className="modal-overlay active" role="alertdialog" aria-modal="true">
      <div className="modal-box modal-box--sm ban-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onCancel}>
          <i className="ti ti-x" />
        </button>

        <h2 className="modal-title">
          <i className="ti ti-ban" /> Desclassificar personagem
        </h2>

        <div className="ban-modal-body">
          <p className="ban-modal-nick">
            Desclassificando: <strong>{entry.character_name || entry.name}</strong>
          </p>

          <div className="ban-modal-field">
            <label className="form-label" htmlFor="disq-reason">
              Motivo da desclassificação <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <select
              id="disq-reason"
              className="form-input ban-reason-select"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="">Selecione um motivo...</option>
              {DISQUALIFY_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="ban-modal-field">
            <label className="form-label" htmlFor="disq-detail">
              Detalhes <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(opcional, mas recomendado)</span>
            </label>
            <textarea
              id="disq-detail"
              className="form-input ban-note-textarea"
              value={detail}
              onChange={e => setDetail(e.target.value)}
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
            onClick={handleConfirm}
          >
            <i className="ti ti-ban" /> Confirmar desclassificação
          </button>
        </div>
      </div>
    </div>
  );
}

export function PainelPage({ session, onSession, onBack }: Props) {
  const [tab,            setTab]            = useState<Tab>('players');
  const [entryFilter,    setEntryFilter]    = useState<EntryFilter>('all');
  const [entrySearch,    setEntrySearch]    = useState('');
  const [showUpdateRank,       setShowUpdateRank]       = useState(false);
  const [showInviteMod,        setShowInviteMod]        = useState(false);
  const [editObjEntry,         setEditObjEntry]         = useState<Entry | null>(null);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<number | null>(null);
  const [confirmDeathEntryId,  setConfirmDeathEntryId]  = useState<number | null>(null);
  const [sandboxEntry,         setSandboxEntry]         = useState<Entry | null>(null);
  const [disqualifyEntry,      setDisqualifyEntry]      = useState<Entry | null>(null);
  const [entries,        setEntries]        = useState<Entry[]>([]);
  const [sortKey]                           = useState<SortKey>('score');
  const [updatingEntry,  setUpdatingEntry]  = useState<number | null>(null);
  const [entryPage,      setEntryPage]      = useState(1);
  const [deadZonePage,   setDeadZonePage]   = useState(1);
  const { toast, showToast, clearToast }   = useToast();

  const fetchEntries = useCallback(async () => {
    try { setEntries(await apiGetEntries(sortKey, session?.token)); }
    catch (err) { showToast((err as Error).message, 'error'); }
  }, [sortKey, showToast, session?.token]);

  useEffect(() => { setEntrySearch(''); }, [entryFilter]);
  useEffect(() => { setEntryPage(1); }, [entryFilter, entrySearch]);

  const aliveEntries    = useMemo(() => entries.filter(e => e.sandbox_ok !== false &&  e.is_alive),  [entries]);
  const deadEntries     = useMemo(() => entries.filter(e => e.sandbox_ok !== false && !e.is_alive),  [entries]);
  const discEntries     = useMemo(() => entries.filter(e => e.sandbox_ok === false && !isInDeadZone(e)), [entries]);
  const deadZoneEntries = useMemo(() => entries.filter(e => isInDeadZone(e)), [entries]);
  const conflictEntries = useMemo(() => entries.filter(e => !!e.pending_new_character && e.is_alive), [entries]);

  const filteredEntries = useMemo(() => {
    switch (entryFilter) {
      case 'all':          return entries.filter(e => !isInDeadZone(e));
      case 'alive':        return aliveEntries;
      case 'dead':         return deadEntries;
      case 'disqualified': return discEntries;
      case 'conflicts':    return conflictEntries;
    }
  }, [entryFilter, entries, aliveEntries, deadEntries, discEntries, conflictEntries]);

  const searchedEntries = useMemo(() => {
    const q = entrySearch.trim().toLowerCase();
    if (!q) return filteredEntries;
    return filteredEntries.filter(e =>
      (e.character_name ?? '').toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q),
    );
  }, [filteredEntries, entrySearch]);

  const entryTotalPages = Math.max(1, Math.ceil(searchedEntries.length / PAINEL_PAGE_SIZE));
  const safeEntryPage    = Math.min(entryPage, entryTotalPages);
  const paginatedEntries = searchedEntries.slice((safeEntryPage - 1) * PAINEL_PAGE_SIZE, safeEntryPage * PAINEL_PAGE_SIZE);

  const deadZoneTotalPages = Math.max(1, Math.ceil(deadZoneEntries.length / PAINEL_PAGE_SIZE));
  const safeDeadZonePage    = Math.min(deadZonePage, deadZoneTotalPages);
  const paginatedDeadZone   = deadZoneEntries.slice((safeDeadZonePage - 1) * PAINEL_PAGE_SIZE, safeDeadZonePage * PAINEL_PAGE_SIZE);

  const entryCounts: Record<EntryFilter, number> = {
    all:          entries.filter(e => !isInDeadZone(e)).length,
    alive:        aliveEntries.length,
    dead:         deadEntries.length,
    disqualified: discEntries.length,
    conflicts:    conflictEntries.length,
  };

  async function doDeleteEntry(id: number) {
    if (!session) return;
    setConfirmDeleteEntryId(null);
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

  async function handleDisqualifyConfirm(note: string) {
    if (!session || !disqualifyEntry) return;
    const id = disqualifyEntry.id!;
    setDisqualifyEntry(null);
    setUpdatingEntry(id);
    try {
      await apiUpdateEntryStatus(session.token, id, { sandbox_ok: false, note });
      showToast('Personagem desclassificado.', 'success');
      fetchEntries();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdatingEntry(null);
    }
  }

  async function handleConfirmDeath(id: number) {
    if (!session) return;
    setConfirmDeathEntryId(null);
    setUpdatingEntry(id);
    try {
      await apiConfirmDeath(session.token, id);
      showToast('Morte confirmada. Personagem removido do rank com pontos zerados.', 'success');
      fetchEntries();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdatingEntry(null);
    }
  }

  async function handleToggleTestMod(entry: Entry) {
    if (!session || !entry.player_id) return;
    const next = !entry.is_test_mod;
    try {
      await apiSetTestMod(session.token, entry.player_id, next);
      setEntries(prev => prev.map(e =>
        e.player_id === entry.player_id ? { ...e, is_test_mod: next } : e,
      ));
      showToast(next ? 'Moderador de Teste definido.' : 'Tag de Moderador de Teste removida.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
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
        <PainelLogin onSuccess={(s) => { clearToast(); onSession(s); }} onBack={onBack} showToast={showToast} />
        <Toast {...toast} onClose={clearToast} />
      </>
    );
  }

  if (sandboxEntry) {
    return <SandboxPage entry={sandboxEntry} onBack={() => setSandboxEntry(null)} />;
  }

  function EntryCard({ entry }: { entry: Entry }) {
    const busy = updatingEntry === entry.id;
    const dz = isInDeadZone(entry);
    return (
      <div className={`painel-entry-card${dz ? ' entry-dead-zone' : entry.sandbox_ok === false ? ' entry-disqualified' : entry.is_alive ? ' entry-alive' : ' entry-dead'}`}>
        <div className="painel-entry-identity">
          <span className="painel-entry-char">{entry.character_name || '—'}</span>
          <span className="painel-entry-player"><i className="ti ti-user" /> {entry.name}</span>
        </div>
        <div className="painel-entry-stats">
          <span><i className="ti ti-calendar" /> {entry.days}d</span>
          <span><i className="ti ti-sword" /> {entry.kills.toLocaleString('pt-BR')}</span>
          <span><i className="ti ti-star" /> {entry.score.toLocaleString('pt-BR')} pts</span>
          {(entry.updated_at ?? entry.created_at) && (
            <span className="painel-entry-updated">
              <i className="ti ti-clock-edit" /> {fmtEntryDate(entry.updated_at ?? entry.created_at)}
            </span>
          )}
          <EntryStatusBadge entry={entry} />
        </div>
        <DisqDetail entry={entry} />
        {entry.pending_new_character && entry.is_alive && (
          <div className="painel-conflict-alert">
            <i className="ti ti-alert-triangle" />
            <div className="painel-conflict-text">
              <span>Tentou iniciar nova run como <strong>{entry.pending_new_character}</strong></span>
              {entry.pending_new_character_since && (
                <span className="painel-conflict-date">desde {fmtEntryDate(entry.pending_new_character_since)}</span>
              )}
            </div>
          </div>
        )}
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
            title="Marcar como Morto (preserva pontos)"
            onClick={() => handleEntryStatus(entry.id!, { is_alive: false, sandbox_ok: true }, 'Morto')}
          >
            <i className="ti ti-skull" /> Morto
          </button>
          {entry.pending_new_character && entry.is_alive && (
            <button
              className="btn-danger btn-sm"
              disabled={busy}
              title="Confirmar morte não registrada — zera os pontos e libera nova run"
              onClick={() => setConfirmDeathEntryId(entry.id!)}
            >
              <i className="ti ti-skull-crossed" /> Confirmar Morte
            </button>
          )}
          <button
            className="btn-danger btn-sm"
            disabled={busy || entry.sandbox_ok === false}
            title="Desclassificar"
            onClick={() => setDisqualifyEntry(entry)}
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
            className="btn-secondary btn-sm"
            disabled={busy}
            title="Ver configurações de Sandbox"
            onClick={() => setSandboxEntry(entry)}
          >
            <i className="ti ti-adjustments" />
            {entry.sandbox_config ? '' : <span className="sbx-btn-missing" title="Sandbox não enviado"> !</span>}
          </button>
          <button
            className={`btn-sm${entry.is_test_mod ? ' btn-test-mod-active' : ' btn-secondary'}`}
            disabled={busy || !entry.player_id}
            title={entry.is_test_mod ? 'Remover tag de Moderador de Teste' : 'Definir como Moderador de Teste'}
            onClick={() => handleToggleTestMod(entry)}
          >
            <i className="ti ti-microscope" /> Mod Teste
          </button>
          <button
            className="btn-ghost btn-sm"
            disabled={busy}
            title="Remover entrada"
            onClick={() => setConfirmDeleteEntryId(entry.id!)}
          >
            <i className="ti ti-trash" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="painel-wrap">
      {/* ── Header do painel ── */}
      <header className="painel-header">
        <div className="container painel-header-inner">
          <div className="painel-header-left">
            <button className="btn-primary btn-sm" onClick={onBack}>
              <i className="ti ti-arrow-left" /> Voltar ao Ranking
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
          <button className={`painel-tab${tab === 'entries' ? ' active' : ''}`}
            onClick={() => { setTab('entries'); fetchEntries(); }}>
            <i className="ti ti-list-numbers" /> Entradas
            {entries.length > 0 && <span className="rank-tab-badge">{entries.length}</span>}
          </button>
          <button className={`painel-tab${tab === 'moderators' ? ' active' : ''}`}
            onClick={() => setTab('moderators')}>
            <i className="ti ti-shield-star" /> Moderadores
          </button>
          <button className={`painel-tab${tab === 'mods' ? ' active' : ''}`}
            onClick={() => setTab('mods')}>
            <i className="ti ti-puzzle" /> Mods
          </button>
          <button className={`painel-tab${tab === 'decoder' ? ' active' : ''}`}
            onClick={() => setTab('decoder')}>
            <i className="ti ti-zoom-code" /> Decoder
          </button>
          {session.role === 'master' && (
            <button className={`painel-tab${tab === 'seasons' ? ' active' : ''}`}
              onClick={() => setTab('seasons')}>
              <i className="ti ti-trophy" /> Temporadas
            </button>
          )}
          <button className={`painel-tab${tab === 'jornal' ? ' active' : ''}`}
            onClick={() => setTab('jornal')}>
            <i className="ti ti-news" /> Jornal
          </button>
          {session.role === 'master' && (
            <button className={`painel-tab${tab === 'financas' ? ' active' : ''}`}
              onClick={() => setTab('financas')}>
              <i className="ti ti-cash" /> Finanças
            </button>
          )}
        </div>
        <button className="btn-primary" onClick={() => { fetchEntries(); setShowUpdateRank(true); }}>
          <i className="ti ti-trophy" /> Atualizar Rank
        </button>
      </div>

      {/* ── Conteúdo ── */}
      <main className="container painel-main">
        {tab === 'players' && (
          <PendingPlayers token={session.token} showToast={showToast} />
        )}

        {tab === 'mods' && (
          <ModManagement token={session.token} showToast={showToast} />
        )}

        {tab === 'decoder' && <CodeDecoder />}

        {tab === 'seasons' && session.role === 'master' && (
          <SeasonManager token={session.token} showToast={showToast} />
        )}

        {tab === 'jornal' && (
          <NewsManager token={session.token} showToast={showToast} />
        )}

        {tab === 'financas' && session.role === 'master' && (
          <FinancesManager token={session.token} showToast={showToast} />
        )}

        {tab === 'moderators' && (
          <ModeratorsList
            token={session.token}
            currentId={session.modId}
            showToast={showToast}
            onInviteClick={() => setShowInviteMod(true)}
          />
        )}

        {tab === 'entries' && (
          <div className="painel-section">
            <div className="painel-section-header">
              <h2><i className="ti ti-list-numbers" /> Entradas no Ranking</h2>
              <button className="btn-primary btn-sm" onClick={fetchEntries}>
                <i className="ti ti-refresh" /> Atualizar
              </button>
            </div>

            {/* Filtros de status */}
            <div className="painel-section-filter">
              <div className="filter-bar">
                {ENTRY_FILTER_CONFIG.map(({ key, label, icon }) => (
                  <button key={key}
                    className={`sort-btn filter-entry-${key}${entryFilter === key ? ' active' : ''}`}
                    onClick={() => setEntryFilter(key)}>
                    <i className={`ti ${icon}`} />
                    {' '}{label}
                    <span className="rank-tab-badge">{entryCounts[key]}</span>
                  </button>
                ))}
              </div>

              <div className="painel-search-bar">
                <i className="ti ti-search" />
                <input
                  type="text"
                  placeholder={`Buscar em ${ENTRY_FILTER_CONFIG.find(f => f.key === entryFilter)?.label.toLowerCase() ?? 'entradas'}...`}
                  value={entrySearch}
                  onChange={e => setEntrySearch(e.target.value)}
                />
                {entrySearch && (
                  <button className="painel-search-clear" onClick={() => setEntrySearch('')} title="Limpar busca">
                    <i className="ti ti-x" />
                  </button>
                )}
              </div>
            </div>

            {entries.length === 0 && (
              <div className="painel-empty-state">
                <i className="ti ti-list-search" />
                <p>Clique em "Atualizar" para carregar as entradas.</p>
              </div>
            )}

            {filteredEntries.length === 0 && entries.length > 0 && (
              <div className="painel-empty-state">
                <i className="ti ti-filter-off" />
                <p>Nenhuma entrada encontrada para este filtro.</p>
              </div>
            )}

            {searchedEntries.length === 0 && filteredEntries.length > 0 && (
              <div className="painel-empty-state">
                <i className="ti ti-search-off" />
                <p>Nenhum resultado para "<strong>{entrySearch}</strong>".</p>
              </div>
            )}

            <div className="painel-entries-list">
              {paginatedEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>

            <Pagination page={safeEntryPage} totalPages={entryTotalPages} onChange={setEntryPage} />

            {/* ── Dead-Zone ── */}
            {deadZoneEntries.length > 0 && (
              <div className="dead-zone-section">
                <div className="dead-zone-header">
                  <h3><i className="ti ti-biohazard" /> Dead-Zone</h3>
                  <span className="dead-zone-count">{deadZoneEntries.length}</span>
                  <p className="dead-zone-desc">
                    Jogadores desclassificados há mais de {DEAD_ZONE_DAYS} dias sem atualização de status.
                    Não aparecem mais no rank público.
                  </p>
                </div>
                <div className="painel-entries-list">
                  {paginatedDeadZone.map(entry => {
                    const busy = updatingEntry === entry.id;
                    return (
                      <div key={entry.id} className="painel-entry-card entry-dead-zone">
                        <div className="painel-entry-identity">
                          <span className="painel-entry-char">{entry.character_name || '—'}</span>
                          <span className="painel-entry-player"><i className="ti ti-user" /> {entry.name}</span>
                        </div>
                        <div className="painel-entry-stats">
                          <span><i className="ti ti-calendar" /> {entry.days}d</span>
                          <span><i className="ti ti-sword" /> {entry.kills.toLocaleString('pt-BR')}</span>
                          {entry.disqualified_at && (
                            <span className="painel-entry-updated">
                              <i className="ti ti-ban" /> Desc. em {fmtEntryDate(entry.disqualified_at)}
                            </span>
                          )}
                          <span className="alive-badge dead-zone-badge">
                            <i className="ti ti-biohazard" /> Dead-Zone
                          </span>
                        </div>
                        <DisqDetail entry={entry} />
                        <div className="painel-entry-actions">
                          <button
                            className="btn-success btn-sm"
                            disabled={busy}
                            title="Restaurar como Vivo"
                            onClick={() => handleEntryStatus(entry.id!, { is_alive: true, sandbox_ok: true }, 'Vivo')}
                          >
                            <i className="ti ti-heartbeat" /> Vivo
                          </button>
                          <button
                            className="btn-warning btn-sm"
                            disabled={busy}
                            title="Restaurar como Morto"
                            onClick={() => handleEntryStatus(entry.id!, { is_alive: false, sandbox_ok: true }, 'Morto')}
                          >
                            <i className="ti ti-skull" /> Morto
                          </button>
                          <button
                            className="btn-danger btn-sm"
                            disabled={busy}
                            title="Excluir permanentemente"
                            onClick={() => setConfirmDeleteEntryId(entry.id!)}
                          >
                            <i className="ti ti-trash" /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination page={safeDeadZonePage} totalPages={deadZoneTotalPages} onChange={setDeadZonePage} />
              </div>
            )}
          </div>
        )}
      </main>

      <Toast {...toast} onClose={clearToast} />

      {showUpdateRank && (
        <UpdateRankModal
          token={session.token}
          entries={entries}
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

      {showInviteMod && (
        <InviteModeratorModal
          token={session.token}
          onClose={() => setShowInviteMod(false)}
          showToast={showToast}
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

      {confirmDeathEntryId !== null && (
        <ConfirmModal
          title="Confirmar morte não registrada"
          message="O personagem será marcado como morto e os pontos serão zerados (score = 0), liberando o jogador para iniciar uma nova run do zero. Esta ação não pode ser desfeita."
          confirmLabel="Confirmar Morte"
          danger
          onConfirm={() => handleConfirmDeath(confirmDeathEntryId)}
          onCancel={() => setConfirmDeathEntryId(null)}
        />
      )}
      {disqualifyEntry && (
        <DisqualifyModal
          entry={disqualifyEntry}
          onConfirm={handleDisqualifyConfirm}
          onCancel={() => setDisqualifyEntry(null)}
        />
      )}
    </div>
  );
}