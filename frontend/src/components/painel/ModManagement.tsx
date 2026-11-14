import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetAllMods, apiAddMod, apiUpdateMod, apiBlockMod, apiUnblockMod, apiDeleteMod, apiRefreshModImages, apiSetModCategories, apiRefreshWorkshop } from '../../lib/api';
import {
  MOD_CATEGORIES, categoryLabel, groupMods, matchesQuery, sortGroups, countByCategory, isStaleGroup,
  type ModGroup, type ModGroupStatus, type ModSort,
} from '../../lib/modsList';
import type { Mod } from '../../types';
import { ConfirmModal } from './ConfirmModal';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return (
    String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear() + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

interface Props {
  token:     string;
  showToast: (msg: string, type?: string) => void;
}

// Filtros só da moderação (v4.36.0), além dos da página pública.
type ExtraFilter = 'all' | 'required' | 'stale' | 'nosteam' | 'override' | 'others';
const EXTRA_FILTERS: Array<{ value: ExtraFilter; label: string }> = [
  { value: 'all',      label: 'Todos os itens' },
  { value: 'required', label: 'Obrigatórios' },
  { value: 'stale',    label: 'Sem atualização há 6+ meses' },
  { value: 'nosteam',  label: 'Sem dados da Steam' },
  { value: 'override', label: 'Categoria definida pela moderação' },
  { value: 'others',   label: 'Sem categoria (Outros)' },
];
function matchesExtra(g: ModGroup, f: ExtraFilter): boolean {
  switch (f) {
    case 'required': return g.required;
    case 'stale':    return isStaleGroup(g);
    case 'nosteam':  return !!g.workshopId && g.subscriptions == null;
    case 'override': return g.mods.some(m => m.category_override);
    case 'others':   return g.categories.length === 1 && g.categories[0] === 'outros';
    default:         return true;
  }
}
const STATUS_FILTERS: Array<{ value: 'all' | ModGroupStatus; label: string }> = [
  { value: 'all',     label: 'Todos' },
  { value: 'allowed', label: 'Ativos' },
  { value: 'mixed',   label: 'Parciais' },
  { value: 'blocked', label: 'Bloqueados' },
];

// Categoria do item na página pública (v4.34.0). Vem das tags da Steam; o moderador
// pode trocar. "Voltar às tags da Steam" apaga a correção.
function CategoryEditor({ group, busy, onSave }: {
  group: Mod[]; busy: boolean; onSave: (categories: string[] | null) => Promise<void>;
}) {
  const primary  = group[0];
  const current  = primary.categories ?? ['outros'];
  const override = group.some(m => m.category_override);
  const [open, setOpen]         = useState(false);
  const [picked, setPicked]     = useState<string[]>(current);
  if (!primary.workshop_id) return null;

  if (!open) {
    return (
      <div className="mod-card-painel-cats">
        <i className="ti ti-tag" aria-hidden="true" />
        {current.map(c => categoryLabel(c, true)).join(', ')}
        {override && <span className="mod-card-painel-cats-note">(definida pela moderação)</span>}
        <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => { setPicked(current); setOpen(true); }}>
          Alterar
        </button>
      </div>
    );
  }
  return (
    <div className="mod-card-painel-cats-edit">
      <div className="mod-card-painel-cats-options">
        {MOD_CATEGORIES.map(c => (
          <label key={c.slug} className={picked.includes(c.slug) ? 'on' : ''}>
            <input
              type="checkbox"
              checked={picked.includes(c.slug)}
              onChange={e => setPicked(p => e.target.checked ? [...p, c.slug] : p.filter(x => x !== c.slug))}
            />
            {c.label}
          </label>
        ))}
      </div>
      <div className="mod-card-painel-cats-actions">
        <button type="button" className="btn-primary btn-sm" disabled={busy || picked.length === 0}
                onClick={async () => { await onSave(picked); setOpen(false); }}>
          Salvar categoria
        </button>
        {override && (
          <button type="button" className="btn-secondary btn-sm" disabled={busy}
                  onClick={async () => { await onSave(null); setOpen(false); }}>
            Voltar às tags da Steam
          </button>
        )}
        <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </div>
  );
}

// Um card por item da Oficina Steam (agrupado por workshop_id) — nao mais um card
// por mod_id. Um item com N mod_ids aparece UMA vez, listando os N IDs e o status
// de cada um dentro do mesmo card, em vez de repetir nome/imagem/link N vezes.
function ModGroupCard({
  group, busy, onEdit, onBlockClick, onUnblock, onDelete, onSaveCategories,
}: {
  group: Mod[]; busy: boolean;
  onEdit: () => void; onBlockClick: () => void; onUnblock: () => void; onDelete: () => void;
  onSaveCategories: (categories: string[] | null) => Promise<void>;
}) {
  const primary      = group[0];
  const wasUpdated   = primary.updated_at && primary.updated_at !== primary.created_at;
  const allActive    = group.every(m => m.status === 'active');
  const allBlocked   = group.every(m => m.status === 'blocked');
  const isMixed      = !allActive && !allBlocked;

  const deps = useMemo(() => {
    const seen = new Set<number>();
    const out: Array<{ id: number; name: string }> = [];
    for (const m of group) {
      for (const d of m.dependencies) {
        if (!seen.has(d.id)) { seen.add(d.id); out.push(d); }
      }
    }
    return out;
  }, [group]);

  return (
    <div className={`mod-card-painel${allBlocked ? ' mod-blocked' : ''}${isMixed ? ' mod-mixed' : ''}`}>
      <div className="mod-card-painel-info">
        {primary.image_url
          ? <img src={primary.image_url} alt="" className="mod-card-painel-thumb" loading="lazy" />
          : <i className="ti ti-puzzle" />
        }
        <div className="mod-card-painel-text">
          <div className="mod-card-painel-name-row">
            <span className="mod-card-painel-name">{primary.name}</span>
            {primary.is_required && (
              <span className="mod-badge-required mod-badge-sm">
                <i className="ti ti-alert-circle" /> Obrigatório
              </span>
            )}
            {isMixed && (
              <span className="mod-badge-mixed mod-badge-sm">
                <i className="ti ti-arrows-shuffle" /> Status misto
              </span>
            )}
            <a
              href={primary.workshop_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mod-card-painel-link"
              title="Abrir na Oficina Steam"
            >
              <i className="ti ti-external-link" />
            </a>
          </div>
          <div className="mod-card-painel-idlist">
            {group.map(m => (
              m.mod_id ? (
                <span
                  key={m.id}
                  className="mod-sibling-chip"
                  title={m.status === 'blocked' && m.block_reason ? `Motivo: ${m.block_reason}` : undefined}
                >
                  <code>{m.mod_id}</code>
                  <span className={`mod-sibling-status ${m.status}`}>
                    {m.status === 'blocked' ? 'Bloqueado' : 'Permitido'}
                  </span>
                </span>
              ) : (
                <span key={m.id} className="mod-sibling-chip mod-no-id">
                  <i className="ti ti-alert-triangle" /> ID não cadastrado
                </span>
              )
            ))}
          </div>
          {allBlocked && primary.block_reason && (
            <div className="mod-card-painel-block-reason">
              <i className="ti ti-message-exclamation" /> {primary.block_reason}
            </div>
          )}
          {deps.length > 0 && (
            <div className="mod-card-painel-deps">
              <i className="ti ti-link" />
              {deps.map(d => d.name).join(', ')}
            </div>
          )}
          <CategoryEditor group={group} busy={busy} onSave={onSaveCategories} />
          <div className="mod-card-painel-dates">
            <span><i className="ti ti-calendar-plus" /> {fmtDate(primary.created_at)}</span>
            {wasUpdated && (
              <span><i className="ti ti-calendar-edit" /> {fmtDate(primary.updated_at)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="painel-entry-actions">
        <button className="btn-secondary btn-sm" disabled={busy} title="Editar" onClick={onEdit}>
          <i className="ti ti-pencil" /> Editar
        </button>
        {!isMixed && (
          <button
            className={`${allActive ? 'btn-warning' : 'btn-success'} btn-sm`}
            disabled={busy}
            onClick={allActive ? onBlockClick : onUnblock}
          >
            <i className={`ti ${allActive ? 'ti-ban' : 'ti-circle-check'}`} />
            {allActive ? 'Bloquear' : 'Ativar'}
          </button>
        )}
        <button className="btn-ghost btn-sm" disabled={busy} title="Remover" onClick={onDelete}>
          <i className="ti ti-trash" />
        </button>
      </div>
    </div>
  );
}

// Um mod_id dentro do formulario de grupo. `dbId` presente = linha ja existe no banco;
// ausente = ainda nao salva (sera criada via apiAddMod no submit).
interface ModIdEntry {
  key:         string;
  dbId?:       number;
  modId:       string;
  status:      'active' | 'blocked';
  blockReason: string;
}

interface GroupSavePayload {
  name:           string;
  workshop_url:   string;
  is_required:    boolean;
  dependency_ids: number[];
  entries:        Array<{ dbId?: number; mod_id: string; status: 'active' | 'blocked'; block_reason: string | null }>;
  removedIds:     number[];
}

interface GroupFormProps {
  mode:       'add' | 'edit';
  groupMods:  Mod[];
  allMods:    Mod[];
  onSave:     (payload: GroupSavePayload) => Promise<void>;
  onCancel:   () => void;
  submitting: boolean;
}

// Um item da Oficina Steam pode empacotar mais de um mod (mod_ids diferentes), cada um
// podendo ter status independente (permitido/bloqueado). Este formulario trata o grupo
// inteiro como uma unica entidade: campos compartilhados (nome, URL, obrigatorio,
// dependencias) + uma lista de IDs, cada um com seu proprio seletor de status.
function ModGroupForm({ mode, groupMods, allMods, onSave, onCancel, submitting }: GroupFormProps) {
  const primary = groupMods[0] as Mod | undefined;
  const [name,        setName]        = useState(primary?.name ?? '');
  const [workshopUrl, setWorkshopUrl] = useState(primary?.workshop_url ?? '');
  const [isRequired,  setIsRequired]  = useState(primary?.is_required ?? false);
  const [entries,     setEntries]     = useState<ModIdEntry[]>(() =>
    groupMods.map(m => ({
      key: `db-${m.id}`, dbId: m.id, modId: m.mod_id ?? '', status: m.status,
      blockReason: m.block_reason ?? '',
    }))
  );
  const [removedIds, setRemovedIds]     = useState<number[]>([]);
  const [newModId,   setNewModId]       = useState('');
  const [newStatus,  setNewStatus]      = useState<'active' | 'blocked'>('active');
  const [newReason,  setNewReason]      = useState('');
  const [depIds,     setDepIds]     = useState<number[]>(() =>
    Array.from(new Set(groupMods.flatMap(m => m.dependencies.map(d => d.id))))
  );

  const groupIds  = new Set(groupMods.map(m => m.id));
  const otherMods = allMods.filter(m => !groupIds.has(m.id) && m.status === 'active');

  function updateEntry(key: string, patch: Partial<ModIdEntry>) {
    setEntries(prev => prev.map(e => (e.key === key ? { ...e, ...patch } : e)));
  }

  function removeEntry(entry: ModIdEntry) {
    if (entry.dbId) setRemovedIds(prev => [...prev, entry.dbId!]);
    setEntries(prev => prev.filter(e => e.key !== entry.key));
  }

  function addEntry() {
    const trimmed = newModId.trim();
    if (!trimmed) return;
    setEntries(prev => [...prev, {
      key: `new-${Date.now()}-${Math.random()}`, modId: trimmed, status: newStatus,
      blockReason: newStatus === 'blocked' ? newReason.trim() : '',
    }]);
    setNewModId('');
    setNewStatus('active');
    setNewReason('');
  }

  function toggleDep(id: number, checked: boolean) {
    setDepIds(prev => (checked ? [...prev, id] : prev.filter(d => d !== id)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name:           name.trim(),
      workshop_url:   workshopUrl.trim(),
      is_required:    isRequired,
      dependency_ids: depIds,
      entries:        entries.map(en => ({
        dbId:         en.dbId,
        mod_id:       en.modId.trim(),
        status:       en.status,
        block_reason: en.status === 'blocked' ? (en.blockReason.trim() || null) : null,
      })),
      removedIds,
    });
  }

  const canSubmit = !!name.trim() && !!workshopUrl.trim() && entries.length > 0
    && entries.every(en => en.modId.trim())
    && entries.every(en => en.status !== 'blocked' || en.blockReason.trim());

  return (
    <form className="mod-add-form mod-edit-form" onSubmit={handleSubmit}>
      <div className="mod-edit-form-title">
        <i className={`ti ${mode === 'add' ? 'ti-plus' : 'ti-pencil'}`} />
        {mode === 'add' ? 'Adicionando mod' : `Editando item (${entries.length} ID${entries.length !== 1 ? 's' : ''})`}
      </div>
      {mode === 'add' && (
        <div className="mod-info-banner">
          <i className="ti ti-info-circle" />
          <div>
            <strong>Um item da Oficina Steam pode empacotar mais de um mod.</strong> Cada mod tem
            seu próprio <code>id=</code> dentro do <code>mod.info</code>, e cada um pode ter um
            status diferente — um permitido, outro bloqueado.
            <div className="mod-info-banner-example">
              Cadastre todos os IDs desse item de uma vez: preencha o nome e a URL, use{' '}
              <strong>Adicionar</strong> para incluir cada ID (com seu próprio status), e clique em{' '}
              <strong>Salvar</strong> só uma vez no final. Ex: o item "TWISTV Bug Fix" tem os IDs{' '}
              <code>twistvbugfix</code> e <code>twistvbugfixwmodloadorder</code>.
            </div>
          </div>
        </div>
      )}
      <div className="mod-add-fields">
        <div className="mod-field">
          <label className="mod-field-label">Nome do mod</label>
          <input
            type="text"
            className="mod-input"
            placeholder="Ex: Braven's Firearms"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mod-field">
          <label className="mod-field-label">
            IDs do mod no PZ
            <span className="mod-field-hint"> — campo <code>id=</code> em mod.info; cada ID tem seu próprio status</span>
          </label>
          <div className="mod-id-list">
            {entries.map(entry => (
              <div key={entry.key} className="mod-id-entry-wrap">
                <div className="mod-id-entry">
                  <input
                    type="text"
                    className="mod-input mod-id-entry-input"
                    placeholder="Ex: PZCommunityRank"
                    value={entry.modId}
                    onChange={e => updateEntry(entry.key, { modId: e.target.value })}
                  />
                  <select
                    className="mod-input mod-id-entry-status"
                    value={entry.status}
                    onChange={e => updateEntry(entry.key, { status: e.target.value as 'active' | 'blocked' })}
                  >
                    <option value="active">Permitido</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                  <button
                    type="button"
                    className="mod-id-entry-remove"
                    title="Remover este ID"
                    onClick={() => removeEntry(entry)}
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                {entry.status === 'blocked' && (
                  <input
                    type="text"
                    className="mod-input mod-id-reason-input"
                    placeholder="Motivo do bloqueio — visível aos jogadores na página de mods"
                    value={entry.blockReason}
                    onChange={e => updateEntry(entry.key, { blockReason: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="mod-id-entry-wrap mod-id-entry-add-wrap">
              <div className="mod-id-entry mod-id-entry-add">
                <input
                  type="text"
                  className="mod-input mod-id-entry-input"
                  placeholder="Ex: ModId003"
                  value={newModId}
                  onChange={e => setNewModId(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEntry(); } }}
                />
                <select
                  className="mod-input mod-id-entry-status"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as 'active' | 'blocked')}
                >
                  <option value="active">Permitido</option>
                  <option value="blocked">Bloqueado</option>
                </select>
                <button type="button" className="btn-secondary btn-sm" onClick={addEntry}>
                  <i className="ti ti-plus" /> Adicionar
                </button>
              </div>
              {newStatus === 'blocked' && (
                <input
                  type="text"
                  className="mod-input mod-id-reason-input"
                  placeholder="Motivo do bloqueio — visível aos jogadores na página de mods"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
        <div className="mod-field">
          <label className="mod-field-label">URL da Oficina Steam</label>
          <input
            type="url"
            className="mod-input"
            placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=..."
            value={workshopUrl}
            onChange={e => setWorkshopUrl(e.target.value)}
            required
          />
        </div>
        {otherMods.length > 0 && (
          <div className="mod-field">
            <label className="mod-field-label">
              <i className="ti ti-link" /> Dependências (requer estes mods)
            </label>
            <div className="mod-deps-checklist">
              {otherMods.map(m => (
                <label key={m.id} className="mod-dep-check-label">
                  <input
                    type="checkbox"
                    className="mod-check"
                    checked={depIds.includes(m.id)}
                    onChange={e => toggleDep(m.id, e.target.checked)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mod-form-footer">
        <label className="mod-check-label">
          <input
            type="checkbox"
            className="mod-check"
            checked={isRequired}
            onChange={e => setIsRequired(e.target.checked)}
          />
          <span>Mod obrigatório</span>
        </label>
        <div className="mod-edit-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-success btn-sm" disabled={submitting || !canSubmit}>
            <i className="ti ti-check" /> {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </form>
  );
}

// Pede o motivo antes de bloquear um item pelo botao rapido do card (fora do
// formulario de edicao). O motivo fica visivel aos jogadores na pagina publica
// de mods, entao e obrigatorio preencher.
function BlockReasonModal({
  targetName, onConfirm, onCancel,
}: {
  targetName: string; onConfirm: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  return (
    <div className="modal-overlay active" role="alertdialog" aria-modal="true">
      <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onCancel}>
          <i className="ti ti-x" />
        </button>
        <h2 className="modal-title">
          <i className="ti ti-ban" /> Bloquear mod
        </h2>
        <p className="confirm-modal-msg">
          Bloqueando <strong>{targetName}</strong>. O motivo abaixo fica visível para os
          jogadores na página pública de mods.
        </p>
        <div className="mod-field">
          <label className="mod-field-label">Motivo do bloqueio</label>
          <textarea
            className="mod-input"
            rows={3}
            placeholder="Ex: Dá vantagem injusta (radar de zumbis, aimbot, etc.)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <div className="confirm-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
            <i className="ti ti-ban" /> Bloquear
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModManagement({ token, showToast }: Props) {
  const [mods,           setMods]           = useState<Mod[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [actionId,       setActionId]       = useState<number | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<Mod[] | null>(null);
  const [blockPrompt,    setBlockPrompt]    = useState<Mod[] | null>(null);
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const [refreshingSteam, setRefreshingSteam] = useState(false);
  // Filtros da lista (v4.36.0)
  const [fQuery,  setFQuery]  = useState('');
  const [fStatus, setFStatus] = useState<'all' | ModGroupStatus>('all');
  const [fCat,    setFCat]    = useState('');
  const [fSort,   setFSort]   = useState<ModSort>('az');
  const [fExtra,  setFExtra]  = useState<ExtraFilter>('all');

  const fetchMods = useCallback(async () => {
    setLoading(true);
    try { setMods(await apiGetAllMods(token)); }
    catch (err) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { fetchMods(); }, [fetchMods]);

  // Salva um grupo inteiro (1..N mod_ids do mesmo item da Oficina) numa unica acao:
  // remove os IDs excluidos, atualiza os existentes (nome/URL/obrigatorio/dependencias
  // compartilhados + texto do proprio ID), cria os novos, e por fim sincroniza status +
  // motivo de bloqueio de cada linha (mesmo quando so o texto do motivo mudou, sem
  // trocar o status em si).
  async function handleGroupSave(payload: {
    name: string; workshop_url: string; is_required: boolean; dependency_ids: number[];
    entries: Array<{ dbId?: number; mod_id: string; status: 'active' | 'blocked'; block_reason: string | null }>;
    removedIds: number[];
  }) {
    setSubmitting(true);
    try {
      for (const id of payload.removedIds) {
        await apiDeleteMod(token, id);
      }

      for (const entry of payload.entries) {
        if (entry.dbId) {
          await apiUpdateMod(token, entry.dbId, {
            name:           payload.name,
            mod_id:         entry.mod_id || null,
            workshop_url:   payload.workshop_url,
            is_required:    payload.is_required,
            dependency_ids: payload.dependency_ids,
          });
        }
      }

      // Mods novos ja nascem com o status final escolhido no formulario (uma unica
      // chamada) — evita criar como "permitido" e bloquear logo em seguida, o que
      // dispararia duas notificacoes do Discord (permitido + bloqueado) para uma
      // unica acao do moderador.
      for (const entry of payload.entries) {
        if (!entry.dbId) {
          await apiAddMod(token, {
            name:           payload.name,
            mod_id:         entry.mod_id || null,
            workshop_url:   payload.workshop_url,
            is_required:    payload.is_required,
            dependency_ids: payload.dependency_ids,
            status:         entry.status,
            block_reason:   entry.block_reason,
          });
        }
      }

      for (const entry of payload.entries) {
        if (entry.dbId) {
          if (entry.status === 'blocked') await apiBlockMod(token, entry.dbId, entry.block_reason ?? undefined);
          else await apiUnblockMod(token, entry.dbId);
        }
      }

      showToast('Mods salvos com sucesso.', 'success');
      setEditingGroupId(null);
      setShowAddForm(false);
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Bloqueia todos os IDs do grupo de uma vez, com o motivo informado no modal —
  // so faz sentido quando o grupo inteiro compartilha o mesmo status hoje
  // (ModGroupCard esconde este botao quando o status ja esta misto; nesse caso o
  // ajuste fino, incluindo motivo por ID, e feito pelo formulario de Editar).
  async function handleBulkBlock(group: Mod[], reason: string) {
    setActionId(group[0].id);
    try {
      for (const m of group) await apiBlockMod(token, m.id, reason);
      showToast(`"${group[0].name}" bloqueado.`, 'success');
      setBlockPrompt(null);
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleBulkUnblock(group: Mod[]) {
    setActionId(group[0].id);
    try {
      for (const m of group) await apiUnblockMod(token, m.id);
      showToast(`"${group[0].name}" ativado.`, 'success');
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteGroup(group: Mod[]) {
    setConfirmDelete(null);
    setActionId(group[0].id);
    try {
      for (const m of group) {
        await apiDeleteMod(token, m.id);
      }
      showToast(`"${group[0].name}" removido.`, 'success');
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleRefreshImages() {
    setRefreshing(true);
    try {
      const { total, updated } = await apiRefreshModImages(token);
      showToast(
        total === 0
          ? 'Todos os mods já possuem imagem.'
          : `${updated} de ${total} mods sem imagem atualizados.`,
        'success'
      );
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSaveCategories(group: Mod[], categories: string[] | null) {
    const wid = group[0].workshop_id;
    if (!wid) return;
    setActionId(group[0].id);
    try {
      await apiSetModCategories(token, wid, categories);
      showToast(categories ? 'Categoria salva.' : 'Categoria voltou a seguir as tags da Steam.', 'success');
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleRefreshWorkshop() {
    setRefreshingSteam(true);
    try {
      const { items, updated, missing } = await apiRefreshWorkshop(token);
      showToast(
        `Dados da Steam atualizados: ${updated} de ${items} itens.` + (missing.length ? ` ${missing.length} sem resposta da Steam.` : ''),
        missing.length ? 'warning' : 'success',
      );
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setRefreshingSteam(false);
    }
  }

  function startEdit(mod: Mod) {
    setShowAddForm(false);
    setEditingGroupId(mod.id);
  }

  // Um mesmo item da Oficina Steam pode empacotar mais de um mod (mod_id diferente,
  // status independente): um card por item (lib/modsList.ts groupMods, o mesmo da
  // página pública). Filtros iguais aos de /mods-lista (v4.36.0), mais os da moderação.
  const allGroups = useMemo(() => groupMods(mods), [mods]);

  const searched = useMemo(
    () => allGroups.filter(g => matchesQuery(g, fQuery) && matchesExtra(g, fExtra)),
    [allGroups, fQuery, fExtra],
  );
  const statusCounts = useMemo(() => {
    const c: Record<ModGroupStatus, number> = { allowed: 0, mixed: 0, blocked: 0 };
    for (const g of searched) c[g.status]++;
    return c;
  }, [searched]);
  const inStatus  = useMemo(() => (fStatus === 'all' ? searched : searched.filter(g => g.status === fStatus)), [searched, fStatus]);
  const catCounts = useMemo(() => countByCategory(inStatus), [inStatus]);
  const filtered  = useMemo(
    () => sortGroups(fCat ? inStatus.filter(g => g.categories.includes(fCat)) : inStatus, fSort),
    [inStatus, fCat, fSort],
  );
  const filtersOn = !!fQuery.trim() || fStatus !== 'all' || !!fCat || fExtra !== 'all';
  function clearFilters() { setFQuery(''); setFStatus('all'); setFCat(''); setFExtra('all'); }

  const groups: Mod[][] = filtered.map(g => g.mods);

  const activeGroups  = groups.filter(g => g.every(m => m.status === 'active'));
  const blockedGroups = groups.filter(g => g.every(m => m.status === 'blocked'));
  const mixedGroups   = groups.filter(g => !g.every(m => m.status === 'active') && !g.every(m => m.status === 'blocked'));

  // Um item da Workshop pode ter varios mod_id (ex: 3 IDs num unico item) - a
  // contagem de grupos (cards) e diferente da contagem de mod_ids individuais,
  // que e o que realmente importa pra whitelist que o Companion gera.
  const countModIds = (gs: Mod[][]) => gs.reduce((sum, g) => sum + g.length, 0);

  function renderGroup(group: Mod[]) {
    if (editingGroupId !== null && group.some(m => m.id === editingGroupId)) {
      return (
        <ModGroupForm
          key={`group-${group[0].id}`}
          mode="edit"
          groupMods={group}
          allMods={mods}
          submitting={submitting}
          onSave={handleGroupSave}
          onCancel={() => setEditingGroupId(null)}
        />
      );
    }
    return (
      <ModGroupCard
        key={`group-${group[0].id}`}
        group={group}
        busy={actionId === group[0].id}
        onEdit={() => startEdit(group[0])}
        onBlockClick={() => setBlockPrompt(group)}
        onUnblock={() => handleBulkUnblock(group)}
        onDelete={() => setConfirmDelete(group)}
        onSaveCategories={cats => handleSaveCategories(group, cats)}
      />
    );
  }

  return (
    <div className="painel-section">

      {/* ── Cabeçalho ── */}
      <div className="mod-mgmt-header">
        <div className="mod-mgmt-header-left">
          <h2 className="mod-mgmt-title">
            <i className="ti ti-puzzle" /> Mods Permitidos
          </h2>
          <p className="mod-mgmt-subtitle">Gerencie os mods aprovados para o desafio</p>
        </div>
        <div className="mod-mgmt-header-actions">
          <button className="btn-secondary btn-sm" onClick={handleRefreshImages} disabled={refreshing} title="Buscar imagens da Steam para mods sem imagem">
            <i className={`ti ${refreshing ? 'ti-loader-2' : 'ti-photo-search'}`} />
            {refreshing ? 'Buscando...' : 'Atualizar imagens'}
          </button>
          <button className="btn-secondary btn-sm" onClick={handleRefreshWorkshop} disabled={refreshingSteam}
                  title="Buscar agora na Steam as tags, inscritos e datas de atualização (o cron faz isso todo dia)">
            <i className={`ti ${refreshingSteam ? 'ti-loader-2' : 'ti-refresh'}`} />
            {refreshingSteam ? 'Consultando...' : 'Atualizar dados da Steam'}
          </button>
          <button className="btn-primary btn-sm" onClick={() => { setShowAddForm(v => !v); setEditingGroupId(null); }}>
            <i className={`ti ${showAddForm ? 'ti-x' : 'ti-plus'}`} />
            {showAddForm ? 'Cancelar' : 'Adicionar Mod'}
          </button>
        </div>
      </div>

      {/* ── Corpo ── */}
      <div className="mod-mgmt-body">

        {showAddForm && (
          <ModGroupForm
            mode="add"
            groupMods={[]}
            allMods={mods}
            submitting={submitting}
            onSave={handleGroupSave}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {loading && <p className="painel-loading">Carregando...</p>}

        {!loading && mods.length === 0 && (
          <div className="painel-empty-state">
            <i className="ti ti-puzzle-off" />
            <p>Nenhum mod cadastrado ainda.</p>
          </div>
        )}

        {!loading && mods.length > 0 && (
          <div className="mm-filters">
            <div className="mm-filters-row">
              <div className="mm-search">
                <i className="ti ti-search" aria-hidden="true" />
                <input
                  type="search"
                  value={fQuery}
                  onChange={e => setFQuery(e.target.value)}
                  placeholder="Buscar por nome, ID do mod ou link da Oficina"
                  aria-label="Buscar mod por nome, ID do mod ou link da Oficina"
                />
              </div>
              <select value={fExtra} onChange={e => setFExtra(e.target.value as ExtraFilter)} aria-label="Mostrar">
                {EXTRA_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <select value={fSort} onChange={e => setFSort(e.target.value as ModSort)} aria-label="Ordenar">
                <option value="az">A–Z</option>
                <option value="recent">Adicionados recentemente</option>
              </select>
            </div>
            <div className="mm-chips" role="group" aria-label="Situação">
              {STATUS_FILTERS.map(f => (
                <button key={f.value} type="button" aria-pressed={fStatus === f.value}
                        className={`mm-chip${fStatus === f.value ? ' active' : ''}`} onClick={() => setFStatus(f.value)}>
                  {f.label} <span>{f.value === 'all' ? searched.length : statusCounts[f.value]}</span>
                </button>
              ))}
            </div>
            <div className="mm-chips" role="group" aria-label="Categoria">
              <button type="button" aria-pressed={!fCat} className={`mm-chip${!fCat ? ' active' : ''}`} onClick={() => setFCat('')}>
                Todas as categorias <span>{inStatus.length}</span>
              </button>
              {MOD_CATEGORIES.filter(c => (catCounts.get(c.slug) ?? 0) > 0 || c.slug === fCat).map(c => (
                <button key={c.slug} type="button" aria-pressed={fCat === c.slug}
                        className={`mm-chip${fCat === c.slug ? ' active' : ''}`} onClick={() => setFCat(fCat === c.slug ? '' : c.slug)}>
                  {c.label} <span>{catCounts.get(c.slug) ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="mm-filters-foot">
              <span>{filtered.length} de {allGroups.length} itens</span>
              {filtersOn && <button type="button" className="btn-ghost btn-sm" onClick={clearFilters}>Limpar filtros</button>}
            </div>
          </div>
        )}

        {!loading && mods.length > 0 && filtered.length === 0 && (
          <div className="painel-empty-state">
            <i className="ti ti-search-off" />
            <p>Nenhum mod com esses filtros.</p>
          </div>
        )}

        {activeGroups.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label">
              <i className="ti ti-circle-check" /> Ativos
              <span className="rank-tab-badge" title={`${activeGroups.length} item(ns) da Workshop, ${countModIds(activeGroups)} mod ID(s) individuais`}>
                {activeGroups.length} itens · {countModIds(activeGroups)} mod IDs
              </span>
            </div>
            {activeGroups.map(renderGroup)}
          </div>
        )}

        {mixedGroups.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label mod-group-label-mixed">
              <i className="ti ti-arrows-shuffle" /> Status misto
              <span className="rank-tab-badge" title={`${mixedGroups.length} item(ns) da Workshop, ${countModIds(mixedGroups)} mod ID(s) individuais`}>
                {mixedGroups.length} itens · {countModIds(mixedGroups)} mod IDs
              </span>
            </div>
            {mixedGroups.map(renderGroup)}
          </div>
        )}

        {blockedGroups.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label mod-group-label-blocked">
              <i className="ti ti-ban" /> Bloqueados
              <span className="rank-tab-badge" title={`${blockedGroups.length} item(ns) da Workshop, ${countModIds(blockedGroups)} mod ID(s) individuais`}>
                {blockedGroups.length} itens · {countModIds(blockedGroups)} mod IDs
              </span>
            </div>
            {blockedGroups.map(renderGroup)}
          </div>
        )}

      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Remover mod"
          message={
            confirmDelete.length > 1
              ? `Tem certeza que deseja remover "${confirmDelete[0].name}" e os ${confirmDelete.length} IDs deste item permanentemente? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja remover "${confirmDelete[0].name}" permanentemente? Esta ação não pode ser desfeita.`
          }
          confirmLabel="Remover"
          danger
          onConfirm={() => handleDeleteGroup(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {blockPrompt && (
        <BlockReasonModal
          targetName={blockPrompt[0].name}
          onConfirm={reason => handleBulkBlock(blockPrompt, reason)}
          onCancel={() => setBlockPrompt(null)}
        />
      )}
    </div>
  );
}
