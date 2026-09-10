import { useCallback, useEffect, useState } from 'react';
import {
  apiGetSeasonFinances, apiGetActiveSeason, apiCreateFinanceEntry,
  apiUpdateFinanceEntry, apiDeleteFinanceEntry,
  apiGetPlayers, apiSetSupporter,
  apiGetFinancialTransparency,
  apiCreateFinancialTransaction, apiUpdateFinancialTransaction, apiDeleteFinancialTransaction,
  apiUpsertPrizeFund, apiSetPrizeDistribution,
} from '../../lib/api';
import type { FinanceEntry, FinanceCategory, Player, Season, FinancialTransaction, PrizeDistributionItem } from '../../types';

// ── Constants ──────────────────────────────────────────────────────────────

const LEGACY_CATEGORIES: { value: FinanceCategory; label: string }[] = [
  { value: 'prize',      label: 'Premiação'      },
  { value: 'adsense',    label: 'Google AdSense' },
  { value: 'supporters', label: 'Apoiadores'     },
  { value: 'sponsor',    label: 'Patrocínios'    },
  { value: 'hosting',    label: 'Hospedagem'     },
  { value: 'domain',     label: 'Domínio'        },
  { value: 'other',      label: 'Outros'         },
];

const TX_TYPES = [
  { value: 'income',     label: 'Entrada'  },
  { value: 'expense',    label: 'Despesa'  },
  { value: 'adjustment', label: 'Ajuste'   },
];

const TX_INCOME_CATS = [
  'donations', 'adsense', 'advertising', 'sponsorship', 'supporters', 'other',
];
const TX_EXPENSE_CATS = [
  'hosting', 'vps', 'domain', 'infrastructure', 'services', 'tools', 'development', 'other',
];

const CAT_LABELS: Record<string, string> = {
  donations: 'Doações', adsense: 'AdSense', advertising: 'Publicidade',
  sponsorship: 'Patrocínios', supporters: 'Apoiadores',
  hosting: 'Hospedagem', vps: 'VPS', domain: 'Domínio',
  infrastructure: 'Infraestrutura', services: 'Serviços',
  tools: 'Ferramentas', development: 'Desenvolvimento',
  other: 'Outros',
};

const FUNDING_SOURCES = [
  { value: 'organization',     label: 'Organização'        },
  { value: 'operational_fund', label: 'Fundo operacional'  },
  { value: 'sponsor',          label: 'Patrocinador'       },
  { value: 'prize_fund',       label: 'Fundo de premiação' },
  { value: 'other',            label: 'Outros'             },
];

const DIST_STATUSES = [
  { value: 'draft',     label: 'Não definida' },
  { value: 'defined',   label: 'Definida'     },
  { value: 'published', label: 'Publicada'    },
  { value: 'paid',      label: 'Paga'         },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtBrl(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Types ──────────────────────────────────────────────────────────────────

type ActiveTab = 'entries' | 'transactions' | 'fund' | 'supporters';

interface Props {
  token:     string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

// legacy form
interface EntryFormState {
  category:   FinanceCategory;
  label:      string;
  amount_brl: string;
  goal_brl:   string;
}
const EMPTY_ENTRY: EntryFormState = { category: 'prize', label: '', amount_brl: '', goal_brl: '' };

// transaction form
interface TxFormState {
  type:            'income' | 'expense' | 'adjustment';
  category:        string;
  description:     string;
  amount_brl:      string;
  funding_source:  string;
  is_prize_fund:   boolean;
  transaction_date: string;
}
const EMPTY_TX: TxFormState = {
  type: 'income', category: 'donations', description: '',
  amount_brl: '', funding_source: 'organization',
  is_prize_fund: true, transaction_date: today(),
};

// prize fund form
interface FundFormState {
  target_amount_brl:    string;
  op_target_amount_brl: string;
  locked:               boolean;
  distribution_status:  string;
}

// distribution row
interface DistRow {
  position:    number;
  percentage:  string;
  fixed_amount: string;
  description:  string;
}

// ── Tips per sub-tab ──────────────────────────────────────────────────────

const TIPS_TRANSACTIONS = [
  'Entradas com "Fundo de premiação" ✓ compõem o valor arrecadado para o prêmio visível na página pública.',
  'Entradas SEM esse marcador são contadas como custo operacional (hospedagem, domínio, serviços).',
  'A Data deve ser o dia em que a movimentação aconteceu, não a data de cadastro.',
  'Remover uma transação faz soft-delete — ela some do histórico público mas permanece no banco.',
  'Tipo "Ajuste" aparece no histórico mas não afeta nenhum total calculado (fundo nem operacional).',
];
const TIPS_FUND = [
  'A Meta de arrecadação é exibida na página pública com barra de progresso para a comunidade acompanhar.',
  '"Fundo protegido" garante que os valores do prêmio não se misturam com custos operacionais.',
  'Evolução de status: Não definida → Definida → Publicada → Paga. Avance gradualmente ao longo da temporada.',
  'Use % OU valor fixo por posição — não é necessário preencher os dois campos ao mesmo tempo.',
  'Salvar a distribuição apaga e recria todas as posições — sempre confira antes de clicar em Salvar.',
];
const TIPS_LEGACY = [
  'Este sistema legado (season_finances) é mantido apenas por compatibilidade com dados históricos antigos.',
  'NÃO alimenta a página pública de transparência — use a aba Transações para novos registros.',
  'Se você é um moderador novo: ignore esta aba — tudo que você precisa está em Transações e Fundo.',
];
const TIPS_SUPPORTERS = [
  'Apoiadores NÃO têm qualquer vantagem competitiva — é reconhecimento público pela contribuição.',
  'Use o nick exato do jogador (case-insensitive). O jogador precisa estar com status aprovado.',
  'Remover um apoiador não apaga dados históricos — apenas remove a marcação ativa.',
];

function TipsBox({ tips }: { tips: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fm-tips-box">
      <button className="fm-tips-toggle" onClick={() => setOpen(o => !o)}>
        <i className="ti ti-info-circle" />
        <span>Como usar este módulo</span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'} fm-tips-chevron`} />
      </button>
      {open && (
        <div className="fm-tips-body">
          {tips.map((tip, i) => (
            <div key={i} className="fm-tip-item">
              <i className="ti ti-point-filled" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function FinancesManager({ token, showToast }: Props) {
  const [tab,     setTab]     = useState<ActiveTab>('transactions');
  const [season,  setSeason]  = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // legacy entries
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [entryForm, setEntryForm] = useState<EntryFormState>(EMPTY_ENTRY);
  const [editEntryId, setEditEntryId] = useState<number | null>(null);

  // transactions
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [txForm, setTxForm] = useState<TxFormState>(EMPTY_TX);
  const [editTxId, setEditTxId] = useState<number | null>(null);

  // prize fund
  const [fundForm, setFundForm] = useState<FundFormState>({
    target_amount_brl: '1000', op_target_amount_brl: '0', locked: true, distribution_status: 'draft',
  });
  const [fundExists, setFundExists] = useState(false);

  // distribution
  const [distRows, setDistRows] = useState<DistRow[]>([]);

  // supporters
  const [players,   setPlayers]  = useState<Player[]>([]);
  const [suppNick,  setSuppNick] = useState('');
  const [suppBusy,  setSuppBusy] = useState<number | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiGetActiveSeason();
      setSeason(s);

      if (s) {
        const [fe, transp, supp] = await Promise.all([
          apiGetSeasonFinances(s.id),
          apiGetFinancialTransparency(s.id),
          apiGetPlayers(token, 'supporter'),
        ]);
        setEntries(fe);
        setTransactions(transp.transactions);
        setPlayers(supp);

        if (transp.prizeFund) {
          setFundExists(true);
          setFundForm({
            target_amount_brl:    String(transp.prizeFund.targetAmount),
            op_target_amount_brl: String(transp.prizeFund.opTargetAmount ?? 0),
            locked:               transp.prizeFund.locked,
            distribution_status:  transp.prizeFund.distributionStatus,
          });
        }

        if (transp.prizeDistribution.length > 0) {
          setDistRows(transp.prizeDistribution.map((d: PrizeDistributionItem) => ({
            position:    d.position,
            percentage:  d.percentage != null ? String(d.percentage) : '',
            fixed_amount: d.fixedAmount != null ? String(d.fixedAmount) : '',
            description:  d.description ?? '',
          })));
        }
      } else {
        const supp = await apiGetPlayers(token, 'supporter');
        setPlayers(supp);
      }
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => { load(); }, [load]);

  // ── Legacy entries ─────────────────────────────────────────────────────────

  function startEditEntry(e: FinanceEntry) {
    setEditEntryId(e.id);
    setEntryForm({
      category: e.category, label: e.label,
      amount_brl: String(e.amount_brl),
      goal_brl: e.goal_brl != null ? String(e.goal_brl) : '',
    });
  }

  async function handleSaveEntry() {
    if (!season) return;
    const amount = parseFloat(entryForm.amount_brl.replace(',', '.'));
    if (!entryForm.label.trim()) { showToast('Label é obrigatório.', 'error'); return; }
    if (isNaN(amount))           { showToast('Valor inválido.', 'error'); return; }
    const goal = entryForm.goal_brl.trim() ? parseFloat(entryForm.goal_brl.replace(',', '.')) : null;
    setSaving(true);
    try {
      if (editEntryId !== null) {
        const updated = await apiUpdateFinanceEntry(token, editEntryId, {
          category: entryForm.category, label: entryForm.label.trim(),
          amount_brl: amount, goal_brl: goal,
        });
        setEntries(prev => prev.map(e => e.id === editEntryId ? updated : e));
        showToast('Entrada atualizada.', 'success');
      } else {
        const created = await apiCreateFinanceEntry(token, {
          season_id: season.id, category: entryForm.category,
          label: entryForm.label.trim(), amount_brl: amount, goal_brl: goal,
        });
        setEntries(prev => [...prev, created]);
        showToast('Entrada criada.', 'success');
      }
      setEditEntryId(null);
      setEntryForm(EMPTY_ENTRY);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleDeleteEntry(id: number) {
    setSaving(true);
    try {
      await apiDeleteFinanceEntry(token, id);
      setEntries(prev => prev.filter(e => e.id !== id));
      showToast('Entrada removida.', 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  function startEditTx(t: FinancialTransaction) {
    setEditTxId(t.id);
    setTxForm({
      type:             t.type,
      category:         t.category,
      description:      t.description,
      amount_brl:       String(t.amount),
      funding_source:   t.fundingSource,
      is_prize_fund:    t.isPrizeFund,
      transaction_date: t.transactionDate,
    });
  }

  function cancelEditTx() { setEditTxId(null); setTxForm(EMPTY_TX); }

  async function handleSaveTx() {
    if (!season) return;
    const amount = parseFloat(txForm.amount_brl.replace(',', '.'));
    if (!txForm.description.trim()) { showToast('Descrição é obrigatória.', 'error'); return; }
    if (!txForm.category.trim())    { showToast('Categoria é obrigatória.', 'error'); return; }
    if (isNaN(amount) || amount <= 0) { showToast('Valor inválido.', 'error'); return; }
    if (!txForm.transaction_date)   { showToast('Data é obrigatória.', 'error'); return; }

    const payload = {
      type: txForm.type, category: txForm.category.trim(),
      description: txForm.description.trim(), amount_brl: amount,
      funding_source: txForm.funding_source,
      is_prize_fund: txForm.is_prize_fund,
      transaction_date: txForm.transaction_date,
    };

    setSaving(true);
    try {
      if (editTxId !== null) {
        await apiUpdateFinancialTransaction(token, editTxId, payload);
        showToast('Transação atualizada.', 'success');
      } else {
        await apiCreateFinancialTransaction(token, { season_id: season.id, ...payload });
        showToast('Transação criada.', 'success');
      }
      cancelEditTx();
      const transp = await apiGetFinancialTransparency(season.id);
      setTransactions(transp.transactions);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleDeleteTx(id: number) {
    if (!confirm('Remover esta transação?')) return;
    setSaving(true);
    try {
      await apiDeleteFinancialTransaction(token, id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Transação removida.', 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  // ── Prize fund ─────────────────────────────────────────────────────────────

  async function handleSaveFund() {
    if (!season) return;
    const target   = parseFloat(fundForm.target_amount_brl.replace(',', '.'));
    const opTarget = parseFloat(fundForm.op_target_amount_brl.replace(',', '.'));
    if (isNaN(target)   || target < 0)   { showToast('Meta do prêmio inválida.', 'error'); return; }
    if (isNaN(opTarget) || opTarget < 0) { showToast('Meta de custos inválida.', 'error'); return; }
    setSaving(true);
    try {
      await apiUpsertPrizeFund(token, {
        season_id: season.id, target_amount_brl: target, op_target_amount_brl: opTarget,
        locked: fundForm.locked, distribution_status: fundForm.distribution_status,
      });
      setFundExists(true);
      showToast('Fundo de premiação salvo.', 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  // ── Distribution ───────────────────────────────────────────────────────────

  function addDistRow() {
    const nextPos = distRows.length > 0
      ? Math.max(...distRows.map(r => r.position)) + 1
      : 1;
    setDistRows(prev => [...prev, { position: nextPos, percentage: '', fixed_amount: '', description: '' }]);
  }

  function removeDistRow(i: number) {
    setDistRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateDistRow(i: number, field: keyof DistRow, val: string | number) {
    setDistRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  async function handleSaveDist() {
    if (!season) return;
    const distribution = distRows.map(r => ({
      position:    r.position,
      percentage:  r.percentage.trim()   ? parseFloat(r.percentage.replace(',', '.'))   : null,
      fixed_amount: r.fixed_amount.trim() ? parseFloat(r.fixed_amount.replace(',', '.')) : null,
      description:  r.description.trim() || null,
    }));
    const invalid = distribution.find(d => d.percentage == null && d.fixed_amount == null);
    if (invalid) { showToast(`Posição ${invalid.position}: informe % ou valor fixo.`, 'error'); return; }

    setSaving(true);
    try {
      await apiSetPrizeDistribution(token, { season_id: season.id, distribution });
      showToast('Distribuição salva.', 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  // ── Supporters ─────────────────────────────────────────────────────────────

  async function handleRemoveSupporter(p: Player) {
    setSuppBusy(p.id);
    try {
      await apiSetSupporter(token, p.id, { is_supporter: false });
      setPlayers(prev => prev.filter(s => s.id !== p.id));
      showToast(`${p.nick} removido dos apoiadores.`, 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSuppBusy(null); }
  }

  async function handleAddSupporter() {
    const nick = suppNick.trim();
    if (!nick) return;
    setSaving(true);
    try {
      const all = await apiGetPlayers(token, 'approved');
      const found = all.find(p => p.nick.toLowerCase() === nick.toLowerCase());
      if (!found) { showToast(`Jogador "${nick}" não encontrado.`, 'error'); return; }
      const updated = await apiSetSupporter(token, found.id, { is_supporter: true });
      if (!players.find(p => p.id === found.id)) {
        setPlayers(prev => [...prev, { ...found, is_supporter: updated.is_supporter, supporter_until: updated.supporter_until }]);
      }
      setSuppNick('');
      showToast(`${found.nick} marcado como apoiador.`, 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setSaving(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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

  const txCats = txForm.type === 'income' ? TX_INCOME_CATS
    : txForm.type === 'expense' ? TX_EXPENSE_CATS
    : [...TX_INCOME_CATS, ...TX_EXPENSE_CATS];

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-cash" /> Finanças da Temporada</h2>
        <button className="btn-ghost btn-sm" onClick={load} title="Recarregar">
          <i className="ti ti-refresh" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="fm-tabs">
        <button className={`fm-tab${tab === 'transactions' ? ' active' : ''}`} onClick={() => setTab('transactions')}>
          <i className="ti ti-arrows-exchange" /> Transações
          {transactions.length > 0 && <span className="rank-tab-badge">{transactions.length}</span>}
        </button>
        <button className={`fm-tab${tab === 'fund' ? ' active' : ''}`} onClick={() => setTab('fund')}>
          <i className="ti ti-trophy" /> Fundo / Premiação
        </button>
        <button className={`fm-tab${tab === 'entries' ? ' active' : ''}`} onClick={() => setTab('entries')}>
          <i className="ti ti-chart-pie" /> Legado
        </button>
        <button className={`fm-tab${tab === 'supporters' ? ' active' : ''}`} onClick={() => setTab('supporters')}>
          <i className="ti ti-heart" /> Apoiadores
          {players.length > 0 && <span className="rank-tab-badge">{players.length}</span>}
        </button>
      </div>

      {!season && (
        <div className="painel-empty-state">
          <i className="ti ti-trophy-off" />
          <p>Nenhuma temporada ativa.</p>
        </div>
      )}

      {/* ── TRANSACTIONS ─────────────────────────────────────────────────── */}
      {season && tab === 'transactions' && (
        <>
          <TipsBox tips={TIPS_TRANSACTIONS} />
          <div className="fm-form-card">
            <h3 className="fm-form-title">
              {editTxId !== null ? 'Editar transação' : 'Nova transação'}
            </h3>
            <div className="fm-form-grid fm-form-grid--3">
              <label className="fm-form-label">
                Tipo
                <select
                  className="fm-form-select"
                  value={txForm.type}
                  onChange={e => {
                    const t = e.target.value as TxFormState['type'];
                    const defaultCat = t === 'income' ? 'donations' : t === 'expense' ? 'hosting' : 'other';
                    setTxForm(f => ({ ...f, type: t, category: defaultCat, is_prize_fund: t === 'income' }));
                  }}
                >
                  {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>

              <label className="fm-form-label">
                Categoria
                <select
                  className="fm-form-select"
                  value={txCats.includes(txForm.category) ? txForm.category : 'other'}
                  onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}
                >
                  {txCats.map(c => <option key={c} value={c}>{CAT_LABELS[c] ?? c}</option>)}
                </select>
              </label>

              <label className="fm-form-label">
                Data
                <input
                  type="date"
                  className="fm-form-input"
                  value={txForm.transaction_date}
                  onChange={e => setTxForm(f => ({ ...f, transaction_date: e.target.value }))}
                />
              </label>

              <label className="fm-form-label" style={{ gridColumn: '1 / -1' }}>
                Descrição
                <input
                  type="text"
                  className="fm-form-input"
                  placeholder="Ex: Hospedagem VPS — setembro 2026"
                  value={txForm.description}
                  onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={160}
                />
              </label>

              <label className="fm-form-label">
                Valor (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  className="fm-form-input"
                  placeholder="0.00"
                  value={txForm.amount_brl}
                  onChange={e => setTxForm(f => ({ ...f, amount_brl: e.target.value }))}
                />
              </label>

              <label className="fm-form-label">
                Fonte do recurso
                <select
                  className="fm-form-select"
                  value={txForm.funding_source}
                  onChange={e => setTxForm(f => ({ ...f, funding_source: e.target.value }))}
                >
                  {FUNDING_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>

              <label className="fm-form-label fm-form-label--check">
                <input
                  type="checkbox"
                  checked={txForm.is_prize_fund}
                  onChange={e => setTxForm(f => ({ ...f, is_prize_fund: e.target.checked }))}
                />
                <span>Fundo de premiação</span>
                <span className="fm-form-hint">Marca se este valor compõe o prêmio</span>
              </label>
            </div>

            <div className="fm-form-actions">
              <button className="btn-primary btn-sm" onClick={handleSaveTx} disabled={saving}>
                <i className={`ti ${editTxId !== null ? 'ti-check' : 'ti-plus'}`} />
                {editTxId !== null ? 'Salvar' : 'Adicionar'}
              </button>
              {editTxId !== null && (
                <button className="btn-ghost btn-sm" onClick={cancelEditTx} disabled={saving}>
                  <i className="ti ti-x" /> Cancelar
                </button>
              )}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="painel-empty-state">
              <i className="ti ti-cash-off" />
              <p>Nenhuma transação cadastrada nesta temporada.</p>
            </div>
          ) : (
            <div className="fm-entries-list">
              {transactions.map(t => (
                <div key={t.id} className={`fm-entry-card fm-tx--${t.type}`}>
                  <div className={`fm-tx-type-badge fm-tx-badge--${t.type}`}>
                    <i className={`ti ${t.type === 'income' ? 'ti-arrow-up' : t.type === 'expense' ? 'ti-arrow-down' : 'ti-adjustments'}`} />
                  </div>
                  <div className="fm-entry-info">
                    <span className="fm-entry-category">
                      {CAT_LABELS[t.category] ?? t.category}
                      {t.isPrizeFund && <span className="fm-prize-tag"> · Fundo</span>}
                    </span>
                    <span className="fm-entry-label">{t.description}</span>
                    <span className="fm-entry-goal">{t.transactionDate}</span>
                  </div>
                  <span className={`fm-entry-amount fm-tx-amount--${t.type}`}>
                    {t.type === 'income' ? '+ ' : '- '}{fmtBrl(t.amount)}
                  </span>
                  <div className="fm-entry-actions">
                    <button className="btn-secondary btn-sm" onClick={() => startEditTx(t)} disabled={saving}>
                      <i className="ti ti-pencil" />
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => handleDeleteTx(t.id)} disabled={saving}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── FUND & DISTRIBUTION ──────────────────────────────────────────── */}
      {season && tab === 'fund' && (
        <>
          <TipsBox tips={TIPS_FUND} />
          {/* Prize fund config */}
          <div className="fm-form-card">
            <h3 className="fm-form-title">
              <i className="ti ti-trophy" /> Configuração do Fundo de Premiação
              {!fundExists && <span className="fm-form-hint fm-form-hint--inline"> (não criado ainda)</span>}
            </h3>
            <div className="fm-form-grid">
              <label className="fm-form-label">
                Meta do prêmio (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  className="fm-form-input"
                  placeholder="1000.00"
                  value={fundForm.target_amount_brl}
                  onChange={e => setFundForm(f => ({ ...f, target_amount_brl: e.target.value }))}
                />
              </label>
              <label className="fm-form-label">
                Meta de custos operacionais (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  className="fm-form-input"
                  placeholder="0.00"
                  value={fundForm.op_target_amount_brl}
                  onChange={e => setFundForm(f => ({ ...f, op_target_amount_brl: e.target.value }))}
                />
              </label>
              <label className="fm-form-label">
                Status da distribuição
                <select
                  className="fm-form-select"
                  value={fundForm.distribution_status}
                  onChange={e => setFundForm(f => ({ ...f, distribution_status: e.target.value }))}
                >
                  {DIST_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label className="fm-form-label fm-form-label--check">
                <input
                  type="checkbox"
                  checked={fundForm.locked}
                  onChange={e => setFundForm(f => ({ ...f, locked: e.target.checked }))}
                />
                <span>Fundo protegido</span>
                <span className="fm-form-hint">Impede uso para despesas operacionais</span>
              </label>
            </div>
            <div className="fm-form-actions">
              <button className="btn-primary btn-sm" onClick={handleSaveFund} disabled={saving}>
                <i className="ti ti-device-floppy" /> Salvar fundo
              </button>
            </div>
          </div>

          {/* Distribution */}
          <div className="fm-form-card">
            <h3 className="fm-form-title">
              <i className="ti ti-award" /> Distribuição da Premiação
            </h3>
            <p className="fm-form-hint" style={{ marginBottom: 12 }}>
              Informe % OU valor fixo por posição. O valor fixo tem prioridade na exibição.
            </p>

            {distRows.length === 0 ? (
              <p className="fm-form-hint" style={{ marginBottom: 12 }}>Nenhuma posição configurada.</p>
            ) : (
              <div className="fm-dist-list">
                {distRows.map((row, i) => (
                  <div key={i} className="fm-dist-row">
                    <span className="fm-dist-pos">{row.position}º</span>
                    <label className="fm-form-label fm-form-label--sm">
                      <span>%</span>
                      <input
                        type="text" inputMode="decimal"
                        className="fm-form-input"
                        placeholder="—"
                        value={row.percentage}
                        onChange={e => updateDistRow(i, 'percentage', e.target.value)}
                      />
                    </label>
                    <label className="fm-form-label fm-form-label--sm">
                      <span>R$ fixo</span>
                      <input
                        type="text" inputMode="decimal"
                        className="fm-form-input"
                        placeholder="—"
                        value={row.fixed_amount}
                        onChange={e => updateDistRow(i, 'fixed_amount', e.target.value)}
                      />
                    </label>
                    <label className="fm-form-label fm-form-label--sm fm-form-label--grow">
                      <span>Descrição</span>
                      <input
                        type="text"
                        className="fm-form-input"
                        placeholder="Opcional"
                        value={row.description}
                        onChange={e => updateDistRow(i, 'description', e.target.value)}
                        maxLength={80}
                      />
                    </label>
                    <button
                      className="btn-ghost btn-sm fm-dist-del"
                      onClick={() => removeDistRow(i)}
                      title="Remover posição"
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="fm-form-actions">
              <button className="btn-secondary btn-sm" onClick={addDistRow}>
                <i className="ti ti-plus" /> Adicionar posição
              </button>
              {distRows.length > 0 && (
                <button className="btn-primary btn-sm" onClick={handleSaveDist} disabled={saving}>
                  <i className="ti ti-device-floppy" /> Salvar distribuição
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── LEGACY ENTRIES ────────────────────────────────────────────────── */}
      {season && tab === 'entries' && (
        <>
          <TipsBox tips={TIPS_LEGACY} />
          <div className="fm-form-card">
            <h3 className="fm-form-title">
              {editEntryId !== null ? 'Editar entrada' : 'Nova entrada'}
              <span className="fm-form-hint fm-form-hint--inline"> — sistema legado</span>
            </h3>
            <div className="fm-form-grid">
              <label className="fm-form-label">
                Categoria
                <select
                  className="fm-form-select"
                  value={entryForm.category}
                  onChange={e => setEntryForm(f => ({ ...f, category: e.target.value as FinanceCategory }))}
                >
                  {LEGACY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label className="fm-form-label">
                Label / Descrição
                <input
                  type="text"
                  className="fm-form-input"
                  placeholder="Ex: Hospedagem do servidor"
                  value={entryForm.label}
                  onChange={e => setEntryForm(f => ({ ...f, label: e.target.value }))}
                  maxLength={120}
                />
              </label>
              <label className="fm-form-label">
                Valor (R$)
                <input
                  type="text" inputMode="decimal"
                  className="fm-form-input"
                  placeholder="0.00"
                  value={entryForm.amount_brl}
                  onChange={e => setEntryForm(f => ({ ...f, amount_brl: e.target.value }))}
                />
              </label>
              <label className="fm-form-label">
                Meta (R$) <span className="fm-form-hint">opcional</span>
                <input
                  type="text" inputMode="decimal"
                  className="fm-form-input"
                  placeholder="1000.00"
                  value={entryForm.goal_brl}
                  onChange={e => setEntryForm(f => ({ ...f, goal_brl: e.target.value }))}
                />
              </label>
            </div>
            <div className="fm-form-actions">
              <button className="btn-primary btn-sm" onClick={handleSaveEntry} disabled={saving}>
                <i className={`ti ${editEntryId !== null ? 'ti-check' : 'ti-plus'}`} />
                {editEntryId !== null ? 'Salvar' : 'Adicionar'}
              </button>
              {editEntryId !== null && (
                <button className="btn-ghost btn-sm" onClick={() => { setEditEntryId(null); setEntryForm(EMPTY_ENTRY); }} disabled={saving}>
                  <i className="ti ti-x" /> Cancelar
                </button>
              )}
            </div>
          </div>
          {entries.length === 0 ? (
            <div className="painel-empty-state"><i className="ti ti-cash-off" /><p>Nenhuma entrada cadastrada.</p></div>
          ) : (
            <div className="fm-entries-list">
              {entries.map(e => (
                <div key={e.id} className={`fm-entry-card fm-entry-cat--${e.category}`}>
                  <div className="fm-entry-info">
                    <span className="fm-entry-category">{LEGACY_CATEGORIES.find(c => c.value === e.category)?.label}</span>
                    <span className="fm-entry-label">{e.label}</span>
                    {e.goal_brl && <span className="fm-entry-goal">Meta: {fmtBrl(e.goal_brl)}</span>}
                  </div>
                  <span className="fm-entry-amount">{fmtBrl(e.amount_brl)}</span>
                  <div className="fm-entry-actions">
                    <button className="btn-secondary btn-sm" onClick={() => startEditEntry(e)} disabled={saving}><i className="ti ti-pencil" /></button>
                    <button className="btn-ghost btn-sm" onClick={() => handleDeleteEntry(e.id)} disabled={saving}><i className="ti ti-trash" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SUPPORTERS ────────────────────────────────────────────────────── */}
      {tab === 'supporters' && (
        <>
          <TipsBox tips={TIPS_SUPPORTERS} />
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
          {players.length === 0 ? (
            <div className="painel-empty-state"><i className="ti ti-heart-off" /><p>Nenhum apoiador cadastrado.</p></div>
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
                  <button className="btn-ghost btn-sm" onClick={() => handleRemoveSupporter(p)} disabled={suppBusy === p.id} title="Remover">
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
