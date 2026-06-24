import { useState } from 'react';
import { toast } from 'sonner';
import { apiUpdateEntryObjectives } from '../../lib/api';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  initObjectives, computeScore,
} from '../../lib/objectives';
import type { Objectives } from '../../lib/objectives';
import type { Entry } from '../../types';
import {
  IconX,
  IconTarget,
  IconStar,
  IconBuildingStore,
  IconChevronUp,
  IconChevronDown,
  IconTrophy,
  IconSword,
  IconSkull,
} from '@tabler/icons-react';

interface Props {
  token:     string;
  entry:     Entry;
  onClose:   () => void;
  onSuccess: () => void;
}

export function EditObjectivesModal({ token, entry, onClose, onSuccess }: Props) {
  const [objectives,   setObjectives]  = useState<Objectives>(() => entry.objectives ?? initObjectives());
  const [expandedBase, setExpandedBase] = useState<string | null>(null);
  const [loading,      setLoading]     = useState(false);

  const previewScore = computeScore(entry.kills, objectives);

  function toggleBase(id: string, checked: boolean) {
    setObjectives(prev => ({
      ...prev,
      bases: { ...prev.bases, [id]: { ...prev.bases[id]!, has_base: checked } },
    }));
    if (checked) setExpandedBase(id);
    else if (expandedBase === id) setExpandedBase(null);
  }

  function toggleBaseItem(id: string, item: keyof Omit<typeof objectives.bases[string], 'has_base'>, checked: boolean) {
    setObjectives(prev => ({
      ...prev,
      bases: { ...prev.bases, [id]: { ...prev.bases[id]!, [item]: checked } },
    }));
  }

  function toggleGlobal(field: 'spiffo_statue' | 'military_base' | 'kills_500k' | 'all_skills_10', checked: boolean) {
    setObjectives(prev => ({ ...prev, [field]: checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiUpdateEntryObjectives(token, entry.id!, objectives);
      toast.success('Objetivos atualizados com sucesso!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box update-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <IconX size={16} />
        </button>
        <h2 className="modal-title">
          <IconTarget size={18} /> Objetivos — {entry.character_name || entry.name}
        </h2>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="objectives-section">
            <div className="objectives-header">
              <span className="form-label">Objetivos concluídos</span>
              <span className="objectives-score-preview">
                <IconStar size={16} /> {previewScore.toLocaleString('pt-BR')} pts
              </span>
            </div>

            {/* Bases Spiffo's */}
            <div className="objectives-group">
              <p className="objectives-group-title"><IconBuildingStore size={16} /> Bases nos Restaurantes Spiffo's</p>
              {SPIFFOS_RESTAURANTS.map(r => {
                const base = objectives.bases[r.id]!;
                const isExpanded = expandedBase === r.id;
                const completedItems = BASE_ITEMS.filter(i => base[i.id]).length;
                return (
                  <div key={r.id} className={`base-item${base.has_base ? ' base-active' : ''}`}>
                    <div className="base-item-header">
                      <label className="obj-checkbox-label">
                        <input type="checkbox" checked={base.has_base}
                          onChange={e => toggleBase(r.id, e.target.checked)} />
                        <span className="obj-check-text">{r.name}</span>
                        {base.has_base && (
                          <span className="base-item-count">{completedItems}/{BASE_ITEMS.length}</span>
                        )}
                      </label>
                      {base.has_base && (
                        <button type="button" className="base-expand-btn"
                          onClick={() => setExpandedBase(isExpanded ? null : r.id)}>
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                    {base.has_base && isExpanded && (
                      <div className="base-subitems">
                        {BASE_ITEMS.map(item => (
                          <label key={item.id} className="obj-checkbox-label sub">
                            <input type="checkbox"
                              checked={base[item.id]}
                              onChange={e => toggleBaseItem(r.id, item.id, e.target.checked)} />
                            <span className="obj-check-text">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Objetivos especiais */}
            <div className="objectives-group">
              <p className="objectives-group-title"><IconStar size={16} /> Objetivos Especiais</p>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.spiffo_statue}
                  onChange={e => toggleGlobal('spiffo_statue', e.target.checked)} />
                <span className="obj-check-text"><IconTrophy size={16} /> Dominou a Sede Spiffo's e pegou a Estátua</span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.military_base}
                  onChange={e => toggleGlobal('military_base', e.target.checked)} />
                <span className="obj-check-text"><IconSword size={16} /> Limpou a base militar de Rosewood</span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.kills_500k}
                  onChange={e => toggleGlobal('kills_500k', e.target.checked)} />
                <span className="obj-check-text"><IconSkull size={16} /> Atingiu 500.000 zumbis abatidos</span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.all_skills_10}
                  onChange={e => toggleGlobal('all_skills_10', e.target.checked)} />
                <span className="obj-check-text"><IconStar size={16} /> Maximizou todas as habilidades (nível 10)</span>
              </label>
            </div>
          </div>

          <button className="btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar objetivos'}
          </button>
        </form>
      </div>
    </div>
  );
}