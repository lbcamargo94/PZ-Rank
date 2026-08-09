import { useState, useEffect } from 'react';
import { apiUpdateEntryObjectives } from '../../lib/api';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  initObjectives, computeScore, countSkills10,
} from '../../lib/objectives';
import type { Objectives } from '../../lib/objectives';
import type { Entry } from '../../types';

interface Props {
  token:     string;
  entry:     Entry;
  onClose:   () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: string) => void;
}

export function EditObjectivesModal({ token, entry, onClose, onSuccess, showToast }: Props) {
  const [objectives,   setObjectives]  = useState<Objectives>(() => entry.objectives ?? initObjectives());
  const [expandedBase, setExpandedBase] = useState<string | null>(null);
  const [loading,      setLoading]     = useState(false);

  const previewScore = computeScore(entry.kills, countSkills10(entry.skills), objectives);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

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

  function toggleGlobal(field: 'spiffo_hq' | 'spiffo_relic' | 'military_base', checked: boolean) {
    setObjectives(prev => ({ ...prev, [field]: checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiUpdateEntryObjectives(token, entry.id!, objectives);
      showToast('Objetivos atualizados com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-box update-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
        <h2 className="modal-title">
          <i className="ti ti-target" /> Objetivos — {entry.character_name || entry.name}
        </h2>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="objectives-section">
            <div className="objectives-header">
              <span className="form-label">Objetivos concluídos</span>
              <span className="objectives-score-preview">
                <i className="ti ti-star" /> {previewScore.toLocaleString('pt-BR')} pts
              </span>
            </div>

            {/* Bases Spiffo's */}
            <div className="objectives-group">
              <p className="objectives-group-title"><i className="ti ti-building-store" /> Bases nos Restaurantes Spiffo's</p>
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
                          <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`} />
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
              <p className="objectives-group-title"><i className="ti ti-star" /> Objetivos Especiais</p>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.spiffo_hq}
                  onChange={e => toggleGlobal('spiffo_hq', e.target.checked)} />
                <span className="obj-check-text"><i className="ti ti-building-store" /> Conquistou a Sede do Spiffo's (Louisville HQ)</span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.spiffo_relic}
                  onChange={e => toggleGlobal('spiffo_relic', e.target.checked)} />
                <span className="obj-check-text"><i className="ti ti-trophy" /> Coletou a Relíquia do Spiffo</span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.military_base}
                  onChange={e => toggleGlobal('military_base', e.target.checked)} />
                <span className="obj-check-text"><i className="ti ti-sword" /> Conquistou a Base Militar de Rosewood</span>
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
