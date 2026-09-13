import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetAllMods, apiAddMod, apiUpdateMod, apiBlockMod, apiUnblockMod, apiDeleteMod, apiRefreshModImages } from '../../lib/api';
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

// Um card por item da Oficina Steam (agrupado por workshop_id) — nao mais um card
// por mod_id. Um item com N mod_ids aparece UMA vez, listando os N IDs e o status
// de cada um dentro do mesmo card, em vez de repetir nome/imagem/link N vezes.
function ModGroupCard({
  group, busy, onEdit, onBulkToggle, onDelete,
}: {
  group: Mod[]; busy: boolean;
  onEdit: () => void; onBulkToggle: () => void; onDelete: () => void;
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
                <span key={m.id} className="mod-sibling-chip">
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
          {deps.length > 0 && (
            <div className="mod-card-painel-deps">
              <i className="ti ti-link" />
              {deps.map(d => d.name).join(', ')}
            </div>
          )}
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
            onClick={onBulkToggle}
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
  key:    string;
  dbId?:  number;
  modId:  string;
  status: 'active' | 'blocked';
}

interface GroupSavePayload {
  name:           string;
  workshop_url:   string;
  is_required:    boolean;
  dependency_ids: number[];
  entries:        Array<{ dbId?: number; mod_id: string; status: 'active' | 'blocked' }>;
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
    groupMods.map(m => ({ key: `db-${m.id}`, dbId: m.id, modId: m.mod_id ?? '', status: m.status }))
  );
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [newModId,   setNewModId]   = useState('');
  const [newStatus,  setNewStatus]  = useState<'active' | 'blocked'>('active');
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
    setEntries(prev => [...prev, { key: `new-${Date.now()}-${Math.random()}`, modId: trimmed, status: newStatus }]);
    setNewModId('');
    setNewStatus('active');
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
      entries:        entries.map(en => ({ dbId: en.dbId, mod_id: en.modId.trim(), status: en.status })),
      removedIds,
    });
  }

  const canSubmit = !!name.trim() && !!workshopUrl.trim() && entries.length > 0 && entries.every(en => en.modId.trim());

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
              <div key={entry.key} className="mod-id-entry">
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
            ))}
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

export function ModManagement({ token, showToast }: Props) {
  const [mods,           setMods]           = useState<Mod[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [actionId,       setActionId]       = useState<number | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<Mod[] | null>(null);
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [refreshing,     setRefreshing]     = useState(false);

  const fetchMods = useCallback(async () => {
    setLoading(true);
    try { setMods(await apiGetAllMods(token)); }
    catch (err) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { fetchMods(); }, [fetchMods]);

  // Salva um grupo inteiro (1..N mod_ids do mesmo item da Oficina) numa unica acao:
  // remove os IDs excluidos, atualiza os existentes (nome/URL/obrigatorio/dependencias
  // compartilhados + texto do proprio ID), cria os novos, e por fim aplica bloqueio/
  // desbloqueio conforme o status escolhido em cada linha do formulario.
  async function handleGroupSave(payload: {
    name: string; workshop_url: string; is_required: boolean; dependency_ids: number[];
    entries: Array<{ dbId?: number; mod_id: string; status: 'active' | 'blocked' }>;
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

      const created: Array<{ id: number; status: 'active' | 'blocked' }> = [];
      for (const entry of payload.entries) {
        if (!entry.dbId) {
          const mod = await apiAddMod(token, {
            name:           payload.name,
            mod_id:         entry.mod_id || null,
            workshop_url:   payload.workshop_url,
            is_required:    payload.is_required,
            dependency_ids: payload.dependency_ids,
          });
          created.push({ id: mod.id, status: entry.status });
        }
      }

      for (const entry of payload.entries) {
        if (entry.dbId) {
          const original = mods.find(m => m.id === entry.dbId);
          if (original && original.status !== entry.status) {
            if (entry.status === 'blocked') await apiBlockMod(token, entry.dbId);
            else await apiUnblockMod(token, entry.dbId);
          }
        }
      }
      for (const c of created) {
        if (c.status === 'blocked') await apiBlockMod(token, c.id);
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

  // Bloqueia/ativa todos os IDs do grupo de uma vez — so faz sentido quando o grupo
  // inteiro compartilha o mesmo status hoje (ModGroupCard esconde este botao quando
  // o status ja esta misto; nesse caso o ajuste fino e feito pelo formulario de Editar).
  async function handleBulkToggle(group: Mod[]) {
    setActionId(group[0].id);
    try {
      const toActive = group.every(m => m.status === 'blocked');
      for (const m of group) {
        if (toActive) await apiUnblockMod(token, m.id);
        else await apiBlockMod(token, m.id);
      }
      showToast(`"${group[0].name}" ${toActive ? 'ativado' : 'bloqueado'}.`, 'success');
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

  function startEdit(mod: Mod) {
    setShowAddForm(false);
    setEditingGroupId(mod.id);
  }

  // Um mesmo item da Oficina Steam pode empacotar mais de um mod (mod_id diferente,
  // status independente). Agrupa por workshop_id para exibir UM card por item, em
  // vez de repetir nome/imagem/link uma vez por mod_id. Mods sem workshop_id viram
  // grupos de 1 (comportamento antigo, mantido).
  const groups = useMemo(() => {
    const map   = new Map<string, Mod[]>();
    const order: string[] = [];
    for (const m of mods) {
      const key = m.workshop_id ? `w-${m.workshop_id}` : `m-${m.id}`;
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(m);
    }
    return order.map(k => map.get(k)!);
  }, [mods]);

  const activeGroups  = groups.filter(g => g.every(m => m.status === 'active'));
  const blockedGroups = groups.filter(g => g.every(m => m.status === 'blocked'));
  const mixedGroups   = groups.filter(g => !g.every(m => m.status === 'active') && !g.every(m => m.status === 'blocked'));

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
        onBulkToggle={() => handleBulkToggle(group)}
        onDelete={() => setConfirmDelete(group)}
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

        {activeGroups.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label">
              <i className="ti ti-circle-check" /> Ativos
              <span className="rank-tab-badge">{activeGroups.length}</span>
            </div>
            {activeGroups.map(renderGroup)}
          </div>
        )}

        {mixedGroups.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label mod-group-label-mixed">
              <i className="ti ti-arrows-shuffle" /> Status misto
              <span className="rank-tab-badge">{mixedGroups.length}</span>
            </div>
            {mixedGroups.map(renderGroup)}
          </div>
        )}

        {blockedGroups.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label mod-group-label-blocked">
              <i className="ti ti-ban" /> Bloqueados
              <span className="rank-tab-badge">{blockedGroups.length}</span>
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
    </div>
  );
}
