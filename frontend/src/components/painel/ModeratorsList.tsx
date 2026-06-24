import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGetModerators, apiDeleteModerator } from '../../lib/api';
import type { Moderator } from '../../types';
import { ConfirmModal } from './ConfirmModal';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface Props {
  token:      string;
  currentId?: string;
  onCreateClick: () => void;
}

const ROLE_LABELS = { master: 'Master', moderator: 'Moderador' };

export function ModeratorsList({ token, currentId, onCreateClick }: Props) {
  const [mods,          setMods]          = useState<Moderator[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; login: string } | null>(null);

  const fetchMods = useCallback(async () => {
    setLoading(true);
    try { setMods(await apiGetModerators(token)); }
    catch (err) { toast.error((err as Error).message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchMods(); }, [fetchMods]);

  async function doDelete(id: string) {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await apiDeleteModerator(token, id);
      toast.success('Moderador removido.');
      fetchMods();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2>Moderadores</h2>
        <button className="btn-primary btn-sm" onClick={onCreateClick}>
          <IconPlus size={16} /> Novo moderador
        </button>
      </div>

      {loading && <p className="painel-loading">Carregando...</p>}

      {mods.map(m => (
        <div key={m.id} className="player-card">
          <div className="player-card-info">
            <span className="player-nick">{m.login}</span>
            <span className={`player-status status-badge-${m.role}`}>{ROLE_LABELS[m.role]}</span>
          </div>
          {m.id !== currentId && m.role !== 'master' && (
            <div className="player-card-actions">
              <button className="btn-danger btn-sm" disabled={deleting === m.id}
                onClick={() => setConfirmDelete({ id: m.id, login: m.login })}>
                <IconTrash size={16} /> Remover
              </button>
            </div>
          )}
        </div>
      ))}

      {confirmDelete && (
        <ConfirmModal
          title="Remover moderador"
          message={`Tem certeza que deseja remover o moderador "${confirmDelete.login}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          danger
          onConfirm={() => doDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}