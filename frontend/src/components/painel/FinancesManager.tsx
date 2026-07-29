import { useCallback, useEffect, useState } from 'react';
import {
  apiGetSeasonFinances, apiGetActiveSeason, apiCreateFinanceEntry,
  apiUpdateFinanceEntry, apiDeleteFinanceEntry,
  apiGetPlayers, apiSetSupporter,
} from '../../lib/api';
import type { FinanceEntry, FinanceCategory, Player } from '../../types';
import type { Season } from '../../types';

const CATEGORIES: { value: FinanceCategory; label: string }[] = [
  { value: 'prize',      label: 'Premiação'      },
  { value: 'adsense',    label: 'Google AdSense' },
  { value: 'supporters', label: 'Apoiadores'     },
  { value: 'sponsor',    label: 'Patrocínios'    },
  { value: 'hosting',    label: 'Hospedagem'     },
  { value: 'domain',     label: 'Domínio'        },
  { value: 'other',      label: 'Outros'         },
];

function fmtBrl(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  token:     string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

interface EntryFormState {
  category:   FinanceCategory;
  label:      string;
  amount_brl: string;
  goal_brl:   string;
}

const EMPTY_FORM: EntryFormState = { category: 'prize', label: '', amount_brl: '', goal_brl: '' };

export function FinancesManager({ token, showToast }: Props) {
  const [season,    setSeason]    = useState<Season | null>(null);
  const [entries,   setEntries]   = useState<FinanceEntry[]>([]);
  const [players,   setPlayers]   = useState<Player[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState<EntryFormState>(EMPTY_FORM);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [suppTab,   setSuppTab]   = useState(false);
  const [suppNick,  setSuppNick]  = useState('');
  const [suppBusy,  setSuppBusy]  = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiGetActiveSeason();
      setSeason(s);

      if (s) {
        const fe = await apiGetSeasonFinances(s.id);
        setEntries(fe);
      }

      const p = await apiGetPlayers(token, 'supporter');
      setPlayers(p);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => { load(); }, [load]);

  function startEdit(e: FinanceEntry) {
    setEditId(e.id);
    setForm({
      category:   e.category,
      label:      e.label,
      amount_brl: String(e.amount_brl),
      goal_brl:   e.goal_brl != null ? String(e.goal_brl) : '',
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!season) return;
    const amount = parseFloat(form.amount_brl.replace(',', '.'));
    if (!form.label.trim()) { showToast('Label é obrigatório.', 'error'); return; }
    if (isNaN(amount))      { showToast('Valor inválido.', 'error'); return; }
    const goal = form.goal_brl.trim() ? parseFloat(form.goal_brl.replace(',', '.')) : null;

    setSaving(true);
    try {
      if (editId !== null) {
        const updated = await apiUpdateFinanceEntry(token, editId, {
          category: form.category, label: form.label.trim(),
          amount_brl: amount, goal_brl: goal,
        });
        setEntries(prev => prev.map(e => e.id === editId ? updated : e));
        showToast('Entrada atualizada.', 'success');
      } else {
        const created = await apiCreateFinanceEntry(token, {
          season_id: season.id, category: form.category,
          label: form.label.trim(), amount_brl: amount, goal_brl: goal,
        });
        setEntries(prev => [...prev, created]);
        showToast('Entrada criada.', 'success');
      }
      cancelEdit();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    try {
      await apiDeleteFinanceEntry(token, id);
      setEntries(prev => prev.filter(e => e.id !== id));
      showToast('Entrada removida.', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSupporter(p: Player) {
    setSuppBusy(p.id);
    try {
      await apiSetSupporter(token, p.id, { is_supporter: false });
      setPlayers(prev => prev.filter(s => s.id !== p.id));
      showToast(`${p.nick} removido dos apoiadores.`, 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSuppBusy(null);
    }
  }

  async function handleAddSupporter() {
    const nick = suppNick.trim();
    if (!nick) return;
    setSaving(true);
    try {
      const all = await apiGetPlayers(token, 'approved');
      const found = all.find(p => p.nick.toLowerCase() === nick.toLowerCase());
      if (!found) { showToast(`Jogador "${nick}" não encontrado entre os aprovados.`, 'error'); return; }
      const updated = await apiSetSupporter(token, found.id, { is_supporter: true });
      if (!players.find(p => p.id === found.id)) {
        setPlayers(prev => [...prev, { ...found, is_supporter: updated.is_supporter, supporter_until: updated.supporter_until }]);
      }
      setSuppNick('');
      showToast(`${found.nick} marcado como apoiador.`, 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="painel-section">
        <div className="painel-empty-state">
          <i className="ti ti-loader-2 spin" />
          <p>Carregando finanças...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-cash" /> Finanças da Temporada</h2>
        <div className="fm-header-actions">
          <button
            className={`btn-secondary btn-sm${!suppTab ? ' active' : ''}`}
            onClick={() => setSuppTab(false)}
          >
            <i className="ti ti-chart-pie" /> Entradas
          </button>
          <button
            className={`btn-secondary btn-sm${suppTab ? ' active' : ''}`}
            onClick={() => setSuppTab(true)}
          >
            <i className="ti ti-heart" /> Apoiadores
            {players.length > 0 && <span className="rank-tab-badge">{players.length}</span>}
          </button>
          <button className="btn-ghost btn-sm" onClick={load}>
            <i className="ti ti-refresh" />
          </button>
        </div>
      </div>

      {!season && (
        <div className="painel-empty-state">
          <i className="ti ti-trophy-off" />
          <p>Nenhuma temporada ativa. Crie uma temporada primeiro.</p>
        </div>
      )}

      {season && !suppTab && (
        <>
          {/* Formulário de entrada */}
          <div className="fm-form-card">
            <h3 className="fm-form-title">{editId !== null ? 'Editar entrada' : 'Nova entrada'}</h3>
            <div className="fm-form-grid">
              <label className="fm-form-label">
                Categoria
                <select
                  className="fm-form-select"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as FinanceCategory }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="fm-form-label">
                Label / Descrição
                <input
                  className="fm-form-input"
                  type="text"
                  placeholder="Ex: Contratação do servidor Vercel"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  maxLength={120}
                />
              </label>
              <label className="fm-form-label">
                Valor (R$)
                <input
                  className="fm-form-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.amount_brl}
                  onChange={e => setForm(f => ({ ...f, amount_brl: e.target.value }))}
                />
              </label>
              <label className="fm-form-label">
                Meta (R$) <span className="fm-form-hint">opcional — exibe barra de progresso</span>
                <input
                  className="fm-form-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="1000.00"
                  value={form.goal_brl}
                  onChange={e => setForm(f => ({ ...f, goal_brl: e.target.value }))}
                />
              </label>
            </div>
            <div className="fm-form-actions">
              <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <i className={`ti ${editId !== null ? 'ti-check' : 'ti-plus'}`} />
                {editId !== null ? 'Salvar' : 'Adicionar'}
              </button>
              {editId !== null && (
                <button className="btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>
                  <i className="ti ti-x" /> Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Lista de entradas */}
          {entries.length === 0 ? (
            <div className="painel-empty-state">
              <i className="ti ti-cash-off" />
              <p>Nenhuma entrada financeira cadastrada.</p>
            </div>
          ) : (
            <div className="fm-entries-list">
              {entries.map(e => (
                <div key={e.id} className={`fm-entry-card fm-entry-cat--${e.category}`}>
                  <div className="fm-entry-info">
                    <span className="fm-entry-category">{CATEGORIES.find(c => c.value === e.category)?.label}</span>
                    <span className="fm-entry-label">{e.label}</span>
                    {e.goal_brl && (
                      <span className="fm-entry-goal">Meta: {fmtBrl(e.goal_brl)}</span>
                    )}
                  </div>
                  <span className="fm-entry-amount">{fmtBrl(e.amount_brl)}</span>
                  <div className="fm-entry-actions">
                    <button className="btn-secondary btn-sm" onClick={() => startEdit(e)} disabled={saving}>
                      <i className="ti ti-pencil" />
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => handleDelete(e.id)} disabled={saving}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {season && suppTab && (
        <>
          {/* Adicionar apoiador */}
          <div className="fm-form-card">
            <h3 className="fm-form-title">Adicionar apoiador</h3>
            <div className="fm-supp-add-row">
              <input
                className="fm-form-input"
                type="text"
                placeholder="Nick exato do jogador (aprovado)"
                value={suppNick}
                onChange={e => setSuppNick(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSupporter()}
              />
              <button className="btn-primary btn-sm" onClick={handleAddSupporter} disabled={saving || !suppNick.trim()}>
                <i className="ti ti-heart-plus" /> Adicionar
              </button>
            </div>
          </div>

          {/* Lista de apoiadores */}
          {players.length === 0 ? (
            <div className="painel-empty-state">
              <i className="ti ti-heart-off" />
              <p>Nenhum apoiador cadastrado.</p>
            </div>
          ) : (
            <div className="fm-supporters-list">
              {players.map(p => (
                <div key={p.id} className="fm-supporter-row">
                  <div className="fm-supporter-info">
                    <i className="ti ti-heart-filled fm-supporter-icon" />
                    <span className="fm-supporter-nick">{p.nick}</span>
                    {p.supporter_until && (
                      <span className="fm-supporter-until">até {new Date(p.supporter_until).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => handleRemoveSupporter(p)}
                    disabled={suppBusy === p.id}
                    title="Remover apoiador"
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
