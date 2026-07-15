import { useState, useEffect, useCallback } from 'react';
import { apiGetAllMods, apiAddMod, apiUpdateMod, apiBlockMod, apiUnblockMod, apiDeleteMod } from '../../lib/api';
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

function ModRow({
  mod, busy, onEdit, onToggleBlock, onDelete,
}: {
  mod: Mod; busy: boolean;
  onEdit: () => void; onToggleBlock: () => void; onDelete: () => void;
}) {
  const wasUpdated = mod.updated_at && mod.updated_at !== mod.created_at;
  return (
    <div className={`mod-card-painel${mod.status === 'blocked' ? ' mod-blocked' : ''}`}>
      <div className="mod-card-painel-info">
        {mod.image_url
          ? <img src={mod.image_url} alt="" className="mod-card-painel-thumb" loading="lazy" />
          : <i className="ti ti-puzzle" />
        }
        <div className="mod-card-painel-text">
          <div className="mod-card-painel-name-row">
            <span className="mod-card-painel-name">{mod.name}</span>
            {mod.is_required && (
              <span className="mod-badge-required mod-badge-sm">
                <i className="ti ti-alert-circle" /> Obrigatório
              </span>
            )}
            <a
              href={mod.workshop_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mod-card-painel-link"
              title="Abrir na Oficina Steam"
            >
              <i className="ti ti-external-link" />
            </a>
          </div>
          <div className="mod-card-painel-dates">
            <span><i className="ti ti-calendar-plus" /> {fmtDate(mod.created_at)}</span>
            {wasUpdated && (
              <span><i className="ti ti-calendar-edit" /> {fmtDate(mod.updated_at)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="painel-entry-actions">
        <button className="btn-secondary btn-sm" disabled={busy} title="Editar mod" onClick={onEdit}>
          <i className="ti ti-pencil" /> Editar
        </button>
        <button
          className={`${mod.status === 'active' ? 'btn-warning' : 'btn-success'} btn-sm`}
          disabled={busy}
          onClick={onToggleBlock}
        >
          <i className={`ti ${mod.status === 'active' ? 'ti-ban' : 'ti-circle-check'}`} />
          {mod.status === 'active' ? 'Bloquear' : 'Ativar'}
        </button>
        <button className="btn-ghost btn-sm" disabled={busy} title="Remover mod" onClick={onDelete}>
          <i className="ti ti-trash" />
        </button>
      </div>
    </div>
  );
}

interface EditFormProps {
  mod:        Mod;
  onSave:     (data: { name: string; workshop_url: string; is_required: boolean }) => Promise<void>;
  onCancel:   () => void;
  submitting: boolean;
}

function EditModForm({ mod, onSave, onCancel, submitting }: EditFormProps) {
  const [name,        setName]        = useState(mod.name);
  const [workshopUrl, setWorkshopUrl] = useState(mod.workshop_url);
  const [isRequired,  setIsRequired]  = useState(mod.is_required);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), workshop_url: workshopUrl.trim(), is_required: isRequired });
  }

  return (
    <form className="mod-add-form mod-edit-form" onSubmit={handleSubmit}>
      <div className="mod-edit-form-title">
        <i className="ti ti-pencil" /> Editando mod
      </div>
      <div className="mod-add-fields">
        <div className="mod-field">
          <label className="mod-field-label">Nome do mod</label>
          <input
            type="text"
            className="mod-input"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mod-field">
          <label className="mod-field-label">URL da Oficina Steam</label>
          <input
            type="url"
            className="mod-input"
            value={workshopUrl}
            onChange={e => setWorkshopUrl(e.target.value)}
            required
          />
        </div>
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
          <button type="submit" className="btn-success btn-sm" disabled={submitting}>
            <i className="ti ti-check" /> {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </form>
  );
}

export function ModManagement({ token, showToast }: Props) {
  const [mods,          setMods]          = useState<Mod[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [actionId,      setActionId]      = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Mod | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState<number | null>(null);
  const [name,          setName]          = useState('');
  const [workshopUrl,   setWorkshopUrl]   = useState('');
  const [isRequired,    setIsRequired]    = useState(false);

  const fetchMods = useCallback(async () => {
    setLoading(true);
    try { setMods(await apiGetAllMods(token)); }
    catch (err) { showToast((err as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { fetchMods(); }, [fetchMods]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiAddMod(token, { name: name.trim(), workshop_url: workshopUrl.trim(), is_required: isRequired });
      showToast('Mod adicionado com sucesso.', 'success');
      setName('');
      setWorkshopUrl('');
      setIsRequired(false);
      setShowForm(false);
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(mod: Mod, data: { name: string; workshop_url: string; is_required: boolean }) {
    setSubmitting(true);
    try {
      await apiUpdateMod(token, mod.id, data);
      showToast('Mod atualizado com sucesso.', 'success');
      setEditingId(null);
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleBlock(mod: Mod) {
    setActionId(mod.id);
    try {
      if (mod.status === 'active') {
        await apiBlockMod(token, mod.id);
        showToast(`Mod "${mod.name}" bloqueado.`, 'success');
      } else {
        await apiUnblockMod(token, mod.id);
        showToast(`Mod "${mod.name}" ativado.`, 'success');
      }
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(mod: Mod) {
    setConfirmDelete(null);
    setActionId(mod.id);
    try {
      await apiDeleteMod(token, mod.id);
      showToast(`Mod "${mod.name}" removido.`, 'success');
      fetchMods();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionId(null);
    }
  }

  function startEdit(mod: Mod) {
    setShowForm(false);
    setEditingId(mod.id);
  }

  const activeMods  = mods.filter(m => m.status === 'active');
  const blockedMods = mods.filter(m => m.status === 'blocked');

  function renderMod(mod: Mod) {
    if (editingId === mod.id) {
      return (
        <EditModForm
          key={mod.id}
          mod={mod}
          submitting={submitting}
          onSave={data => handleUpdate(mod, data)}
          onCancel={() => setEditingId(null)}
        />
      );
    }
    return (
      <ModRow
        key={mod.id}
        mod={mod}
        busy={actionId === mod.id}
        onEdit={() => startEdit(mod)}
        onToggleBlock={() => handleToggleBlock(mod)}
        onDelete={() => setConfirmDelete(mod)}
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
        <button className="btn-primary btn-sm" onClick={() => { setShowForm(v => !v); setEditingId(null); }}>
          <i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} />
          {showForm ? 'Cancelar' : 'Adicionar Mod'}
        </button>
      </div>

      {/* ── Corpo ── */}
      <div className="mod-mgmt-body">

        {showForm && (
          <form className="mod-add-form" onSubmit={handleAdd}>
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
              <button type="submit" className="btn-success btn-sm" disabled={submitting}>
                <i className="ti ti-check" /> {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="painel-loading">Carregando...</p>}

        {!loading && mods.length === 0 && (
          <div className="painel-empty-state">
            <i className="ti ti-puzzle-off" />
            <p>Nenhum mod cadastrado ainda.</p>
          </div>
        )}

        {activeMods.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label">
              <i className="ti ti-circle-check" /> Ativos
              <span className="rank-tab-badge">{activeMods.length}</span>
            </div>
            {activeMods.map(renderMod)}
          </div>
        )}

        {blockedMods.length > 0 && (
          <div className="mod-group">
            <div className="mod-group-label mod-group-label-blocked">
              <i className="ti ti-ban" /> Bloqueados
              <span className="rank-tab-badge">{blockedMods.length}</span>
            </div>
            {blockedMods.map(renderMod)}
          </div>
        )}

      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Remover mod"
          message={`Tem certeza que deseja remover "${confirmDelete.name}" permanentemente? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
