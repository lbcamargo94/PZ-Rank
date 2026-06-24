import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiGetPlayers, apiCreateEntry } from '../../lib/api';
import { parsePzrCode } from '../../lib/decoder';
import {
  SPIFFOS_RESTAURANTS, BASE_ITEMS,
  initObjectives, computeScore, SCORE_KILLS_MAX,
} from '../../lib/objectives';
import type { Objectives } from '../../lib/objectives';
import type { Player } from '../../types';
import {
  IconX,
  IconHeartbeat,
  IconSkull,
  IconCheck,
  IconBan,
  IconAlertTriangle,
  IconStar,
  IconBuildingStore,
  IconChevronUp,
  IconChevronDown,
  IconTrophy,
  IconSword,
} from '@tabler/icons-react';

interface Props {
  token:     string;
  onClose:   () => void;
  onSuccess: () => void;
}

export function UpdateRankModal({ token, onClose, onSuccess }: Props) {
  const [players,      setPlayers]     = useState<Player[]>([]);
  const [playerId,     setPlayerId]    = useState<number | ''>('');
  const [code,         setCode]        = useState('');
  const [objectives,   setObjectives]  = useState<Objectives>(initObjectives);
  const [expandedBase, setExpandedBase] = useState<string | null>(null);
  const [loading,      setLoading]     = useState(false);

  const decoded = parsePzrCode(code.trim());
  const previewScore = decoded
    ? computeScore(decoded.kills, objectives)
    : 0;

  useEffect(() => {
    apiGetPlayers(token, 'approved')
      .then(data => setPlayers(data.filter(p => !p.blocked)))
      .catch(err => toast.error((err as Error).message));
  }, [token]);

  useEffect(() => {
    const d = parsePzrCode(code.trim());
    if (!d) return;
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
        objectives,
      });
      toast.success('Rank atualizado com sucesso!');
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
                  ? <span className="alive-badge alive"><IconHeartbeat size={16} /> Vivo</span>
                  : <span className="alive-badge dead"><IconSkull size={16} /> Morto</span>}
              </div>
            </div>
          )}

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
              <div className="decoded-row">
                <span className="decoded-label">Sandbox</span>
                {decoded.sandboxOk
                  ? <span className="decoded-value sandbox-ok"><IconCheck size={16} /> Válido</span>
                  : <span className="decoded-value sandbox-invalid"><IconBan size={16} /> Inválido — jogador será desclassificado</span>
                }
              </div>
            </div>
          )}
          {decoded && !decoded.sandboxOk && (
            <p className="form-warning">
              <IconAlertTriangle size={16} /> Sandbox inválido: as configurações do servidor divergem do desafio oficial. A entrada será salva com score 0 e marcada como <strong>Desclassificado</strong> no ranking.
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
                  <IconStar size={16} /> {previewScore.toLocaleString('pt-BR')} pts
                </span>
              )}
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
                <span className="obj-check-text">
                  <IconTrophy size={16} /> Dominou a Sede Spiffo's em Louisville e pegou a Estátua do Spiffo
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.military_base}
                  onChange={e => toggleGlobal('military_base', e.target.checked)} />
                <span className="obj-check-text">
                  <IconSword size={16} /> Limpou a base militar secreta de Rosewood
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.kills_500k}
                  onChange={e => toggleGlobal('kills_500k', e.target.checked)} />
                <span className="obj-check-text">
                  <IconSkull size={16} /> Atingiu 500.000 zumbis abatidos
                </span>
              </label>
              <label className="obj-checkbox-label special">
                <input type="checkbox" checked={objectives.all_skills_10}
                  onChange={e => toggleGlobal('all_skills_10', e.target.checked)} />
                <span className="obj-check-text">
                  <IconStar size={16} /> Maximizou todas as habilidades (nível 10)
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