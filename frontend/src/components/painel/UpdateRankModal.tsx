import { useState, useEffect } from 'react';
import { apiGetPlayers, apiCreateEntry } from '../../lib/api';
import { parsePzrCode } from '../../lib/decoder';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  initObjectives, computeScore, SCORE_KILLS_MAX,
} from '../../lib/objectives';
import type { Objectives } from '../../lib/objectives';
import type { Player } from '../../types';

interface Props {
  token:     string;
  onClose:   () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: string) => void;
}

export function UpdateRankModal({ token, onClose, onSuccess, showToast }: Props) {
  const [players,     setPlayers]     = useState<Player[]>([]);
  const [playerId,    setPlayerId]    = useState<number | ''>('');
  const [code,        setCode]        = useState('');
  const [liveUrl,     setLiveUrl]     = useState('');
  const [isAlive,     setIsAlive]     = useState(true);
  const [objectives,  setObjectives]  = useState<Objectives>(initObjectives);
  const [expandedBase, setExpandedBase] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  const decoded = parsePzrCode(code.trim());
  const previewScore = decoded
    ? computeScore(decoded.kills, objectives)
    : 0;

  useEffect(() => {
    apiGetPlayers(token, 'approved')
      .then(data => setPlayers(data.filter(p => !p.blocked)))
      .catch(err => showToast((err as Error).message, 'error'));
  }, [token, showToast]);

  useEffect(() => {
    const d = parsePzrCode(code.trim());
    if (!d) return;
    setIsAlive(d.isAlive);
    if (d.kills >= SCORE_KILLS_MAX) {
      setObjectives(prev => ({ ...prev, kills_500k: true }));
    }
  }, [code]);

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

  function toggleGlobal(field: 'spiffo_statue' | 'military_base' | 'kills_500k' | 'all_skills_10', checked: boolean) {
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
        live_url:   liveUrl.trim() || undefined,
        is_alive:   isAlive,
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
    <div className="modal-overlay active" role="dialog" aria-modal="true" onClick={onClose}>
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

          {/* Status vivo/morto */}
          <div className="alive-toggle-group">
            <span className="form-label">Status do jogador</span>
            <div className="alive-toggle-row">
              <button type="button"
                className={`alive-toggle-btn${isAlive ? ' alive-active' : ''}`}
                onClick={() => setIsAlive(true)}>
                <i className="ti ti-heartbeat" /> Vivo
              </button>
              <button type="button"
                className={`alive-toggle-btn${!isAlive ? ' dead-active' : ''}`}
                onClick={() => setIsAlive(false)}>
                <i className="ti ti-skull" /> Morto
              </button>
            </div>
          </div>

          {/* Live URL */}
          <label className="form-label" htmlFor="ur-live">Link da live (opcional)</label>
          <input id="ur-live" className="form-input" type="url"
            placeholder="https://twitch.tv/..." value={liveUrl}
            onChange={e => setLiveUrl(e.target.value)} />

          {/* Código do mod */}
          <label className="form-label" htmlFor="ur-code">
            Código do mod <span className="required">*</span>
          </label>
          <textarea id="ur-code" className="form-input code-input"
            placeholder="PZRX1:..." rows={3} spellCheck={false}
            value={code} onChange={e => setCode(e.target.value)} />

          {decoded && (
            <div className="decoded-preview">
              <div className="decoded-row"><span className="decoded-label">Personagem</span><span className="decoded-value">{decoded.characterName}</span></div>
              <div className="decoded-row"><span className="decoded-label">Profissão</span><span className="decoded-value">{decoded.profession}</span></div>
              <div className="decoded-row"><span className="decoded-label">Sobreviveu</span><span className="decoded-value">{decoded.days} dias — {decoded.timeStr}</span></div>
              <div className="decoded-row"><span className="decoded-label">Zumbis</span><span className="decoded-value">{decoded.kills.toLocaleString('pt-BR')}</span></div>
            </div>
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
                <input type="checkbox" checked={objectives.spiffo_statue}
                  onChange={e => toggleGlobal('spiffo_statue', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-trophy" /> Dominou a Sede Spiffo's em Louisville e pegou a Estátua do Spiffo
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.military_base}
                  onChange={e => toggleGlobal('military_base', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-sword" /> Limpou a base militar secreta de Rosewood
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.kills_500k}
                  onChange={e => toggleGlobal('kills_500k', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-skull" /> Atingiu 500.000 zumbis abatidos
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.all_skills_10}
                  onChange={e => toggleGlobal('all_skills_10', e.target.checked)} />
                <span className="obj-check-text">
                  <i className="ti ti-star" /> Maximizou todas as habilidades (nível 10)
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
