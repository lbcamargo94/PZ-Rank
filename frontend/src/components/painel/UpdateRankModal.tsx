import { useState, useEffect } from 'react';
import { apiGetPlayers, apiCreateEntry } from '../../lib/api';
import { parsePzrCode } from '../../lib/decoder';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  initObjectives, computeScore,
} from '../../lib/objectives';
import type { Objectives } from '../../lib/objectives';
import type { Player, Entry } from '../../types';

// Mescla objetivos existentes com o template fresco para garantir que
// todos os restaurantes e campos estejam presentes (inclusive novos adicionados depois).
function mergeObjectives(existing: Objectives | null | undefined): Objectives {
  const fresh = initObjectives();
  if (!existing) return fresh;
  return {
    bases:         { ...fresh.bases, ...existing.bases },
    military_base: existing.military_base ?? false,
    spiffo_hq:     existing.spiffo_hq     ?? false,
    spiffo_relic:  existing.spiffo_relic  ?? false,
  };
}

interface Props {
  token:     string;
  entries?:  Entry[];
  onClose:   () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: string) => void;
}

export function UpdateRankModal({ token, entries, onClose, onSuccess, showToast }: Props) {
  const [players,      setPlayers]     = useState<Player[]>([]);
  const [playerId,     setPlayerId]    = useState<number | ''>('');
  const [code,         setCode]        = useState('');
  const [objectives,   setObjectives]  = useState<Objectives>(initObjectives);
  const [expandedBase, setExpandedBase] = useState<string | null>(null);
  const [preloaded,    setPreloaded]   = useState(false);
  const [loading,      setLoading]     = useState(false);

  const decoded = parsePzrCode(code.trim());
  const skills10Count = decoded ? Object.values(decoded.skillLevels).filter(l => l === 10).length : 0;
  const previewScore  = decoded ? computeScore(decoded.kills, skills10Count, objectives) : 0;

  // Detecta se o personagem decodificado já existe no rank para este jogador.
  // Quando true, o backend preserva os objectives do DB e ignora os do form.
  const isExistingCharacter = !!(decoded && playerId && (entries ?? []).some(
    e => e.player_id === Number(playerId) &&
         e.character_name === decoded.characterName &&
         !e.deleted_at,
  ));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(() => {
    apiGetPlayers(token, 'approved')
      .then(data => setPlayers(data.filter(p => !p.blocked)))
      .catch(err => showToast((err as Error).message, 'error'));
  }, [token, showToast]);

  // Ao trocar de jogador: pré-carrega objetivos da entrada atual (alive, maior score)
  useEffect(() => {
    if (!playerId) {
      setObjectives(initObjectives());
      setPreloaded(false);
      setExpandedBase(null);
      return;
    }
    const pid = Number(playerId);
    const playerEntries = (entries ?? [])
      .filter(e => e.player_id === pid && !e.deleted_at)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const current = playerEntries.find(e => e.is_alive) ?? playerEntries[0] ?? null;
    const hasObj  = !!(current?.objectives);
    setObjectives(mergeObjectives(current?.objectives));
    setPreloaded(hasObj);
    setExpandedBase(null);
  }, [playerId, entries]);

  function toggleBase(restaurantId: string, checked: boolean) {
    setObjectives(prev => ({
      ...prev,
      bases: {
        ...prev.bases,
        [restaurantId]: { ...prev.bases[restaurantId]!, has_base: checked },
      },
    }));
    if (checked) setExpandedBase(restaurantId);
    else if (expandedBase === restaurantId) setExpandedBase(null);
  }

  function toggleBaseItem(restaurantId: string, item: keyof Omit<typeof objectives.bases[string], 'has_base'>, checked: boolean) {
    setObjectives(prev => ({
      ...prev,
      bases: {
        ...prev.bases,
        [restaurantId]: { ...prev.bases[restaurantId]!, [item]: checked },
      },
    }));
  }

  function toggleGlobal(field: 'spiffo_hq' | 'spiffo_relic' | 'military_base', checked: boolean) {
    setObjectives(prev => ({ ...prev, [field]: checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !decoded) return;
    setLoading(true);
    try {
      await apiCreateEntry(token, {
        player_id:  playerId as number,
        code:       code.trim(),
        objectives,
      });
      showToast('Rank atualizado com sucesso!', 'success');
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
        <h2 className="modal-title">Atualizar Rank</h2>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>

          {/* Jogador */}
          <label className="form-label" htmlFor="ur-player">
            Jogador <span className="required">*</span>
          </label>
          <select id="ur-player" className="form-input form-select"
            value={playerId}
            onChange={e => setPlayerId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Selecione o jogador...</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.nick}</option>
            ))}
          </select>

          {/* Status vivo/morto — lido diretamente do código */}
          {decoded && (
            <div className="alive-toggle-group">
              <span className="form-label">Status do jogador</span>
              <div className="alive-toggle-row">
                {decoded.isAlive
                  ? <span className="alive-badge alive"><i className="ti ti-heartbeat" /> Vivo</span>
                  : <span className="alive-badge dead"><i className="ti ti-skull" /> Morto</span>}
              </div>
            </div>
          )}

          {/* Código do mod */}
          <label className="form-label" htmlFor="ur-code">
            Código do mod <span className="required">*</span>
          </label>
          <textarea id="ur-code" className="form-input code-input"
            placeholder="PZRX3:..." rows={3} spellCheck={false}
            value={code} onChange={e => setCode(e.target.value)} />

          {decoded && (
            <div className="decoded-preview">
              <div className="decoded-row"><span className="decoded-label">Personagem</span><span className="decoded-value">{decoded.characterName}</span></div>
              <div className="decoded-row"><span className="decoded-label">Profissão</span><span className="decoded-value">{decoded.profession}</span></div>
              <div className="decoded-row"><span className="decoded-label">Sobreviveu</span><span className="decoded-value">{decoded.days} dias — {decoded.timeStr}</span></div>
              <div className="decoded-row"><span className="decoded-label">Zumbis</span><span className="decoded-value">{decoded.kills.toLocaleString('pt-BR')}</span></div>
              <div className="decoded-row">
                <span className="decoded-label">Sandbox</span>
                {decoded.sandboxOk
                  ? <span className="decoded-value sandbox-ok"><i className="ti ti-check" /> Válido</span>
                  : <span className="decoded-value sandbox-invalid"><i className="ti ti-ban" /> Inválido — jogador será desclassificado</span>
                }
              </div>
            </div>
          )}
          {decoded && !decoded.sandboxOk && (
            <p className="form-warning">
              <i className="ti ti-alert-triangle" /> Sandbox inválido: as configurações do servidor divergem do desafio oficial. A entrada será salva com score 0 e marcada como <strong>Desclassificado</strong> no ranking.
            </p>
          )}
          {!decoded && code.length > 6 && (
            <p className="form-error">Código não reconhecido.</p>
          )}

          {/* ── Objetivos ───────────────────────────────────── */}
          <div className="objectives-section">
            <div className="objectives-header">
              <span className="form-label">Objetivos concluídos</span>
              {decoded && (
                <span className="objectives-score-preview">
                  <i className="ti ti-star" /> {previewScore.toLocaleString('pt-BR')} pts
                </span>
              )}
            </div>
            {isExistingCharacter ? (
              <p className="form-info">
                <i className="ti ti-lock" /> Personagem já registrado — objetivos preservados do banco. Use o botão <strong>Obj.</strong> na lista de entradas para editar.
              </p>
            ) : preloaded ? (
              <p className="form-info">
                <i className="ti ti-history" /> Objetivos pré-carregados do registro atual do jogador. Ajuste se necessário.
              </p>
            ) : null}

            {/* Bases Spiffo's */}
            <div className="objectives-group">
              <p className="objectives-group-title"><i className="ti ti-building-store" /> Bases nos Restaurantes Spiffo's</p>
              {SPIFFOS_RESTAURANTS.map(r => {
                const base = objectives.bases[r.id]!;
                const isExpanded = expandedBase === r.id;
                const completedItems = BASE_ITEMS.filter(i => base[i.id]).length;
                return (
                  <div key={r.id} className={`base-item${base.has_base ? ' base-active' : ''}${isExistingCharacter ? ' base-readonly' : ''}`}>
                    <div className="base-item-header">
                      <label className="obj-checkbox-label">
                        <input type="checkbox" checked={base.has_base} disabled={isExistingCharacter}
                          onChange={e => !isExistingCharacter && toggleBase(r.id, e.target.checked)} />
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
                            <input type="checkbox" disabled={isExistingCharacter}
                              checked={base[item.id]}
                              onChange={e => !isExistingCharacter && toggleBaseItem(r.id, item.id, e.target.checked)} />
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
                <input type="checkbox" checked={objectives.spiffo_hq} disabled={isExistingCharacter}
                  onChange={e => !isExistingCharacter && toggleGlobal('spiffo_hq', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-building-store" /> Conquistou a Sede do Spiffo's (Louisville HQ)
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.spiffo_relic} disabled={isExistingCharacter}
                  onChange={e => !isExistingCharacter && toggleGlobal('spiffo_relic', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-trophy" /> Coletou a Relíquia do Spiffo
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.military_base} disabled={isExistingCharacter}
                  onChange={e => !isExistingCharacter && toggleGlobal('military_base', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-sword" /> Conquistou a Base Militar de Rosewood
                </span>
              </label>
            </div>
          </div>

          <button className="btn-primary btn-block" type="submit"
            disabled={loading || !playerId || !decoded}>
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
}
