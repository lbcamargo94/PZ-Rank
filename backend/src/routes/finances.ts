import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../supabase';
import { dbError } from '../lib/errors';
import { requireMaster } from '../middleware/moderator';
import type { ModRequest } from '../middleware/moderator';

const router = Router();

// ── Tipos internos ───────────────────────────────────────────────────────────

type FinanceCategory = 'hosting' | 'prize' | 'domain' | 'adsense' | 'supporters' | 'sponsor' | 'other';
const VALID_CATEGORIES: FinanceCategory[] = ['hosting', 'prize', 'domain', 'adsense', 'supporters', 'sponsor', 'other'];
const FINANCE_COLS = 'id, season_id, category, label, amount_brl, goal_brl, updated_at';

type TxType = 'income' | 'expense' | 'adjustment';
const VALID_TX_TYPES: TxType[] = ['income', 'expense', 'adjustment'];

type FundingSource = 'organization' | 'operational_fund' | 'sponsor' | 'prize_fund' | 'other';
const VALID_FUNDING: FundingSource[] = ['organization', 'operational_fund', 'sponsor', 'prize_fund', 'other'];

const VALID_DIST_STATUS = ['draft', 'defined', 'published', 'paid'] as const;

interface FinTx {
  id: number;
  season_id: number;
  type: string;
  category: string;
  description: string;
  amount_brl: number;
  funding_source: string;
  is_prize_fund: boolean | number;
  is_public: boolean | number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface PrizeFundRow {
  id: number;
  season_id: number;
  target_amount_brl: number;
  op_target_amount_brl: number;
  locked: boolean | number;
  distribution_status: string;
  updated_at: string;
}

interface PrizeDistRow {
  id: number;
  season_id: number;
  position: number;
  percentage: number | null;
  fixed_amount: number | null;
  description: string | null;
}

function bool(v: boolean | number | unknown): boolean {
  return v === true || v === 1;
}

// ── Sistema legado (season_finances) ────────────────────────────────────────

// GET /finances/current — público: finanças da temporada ativa (legado)
router.get('/current', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: season, error: se } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (se) { const e = dbError(se); res.status(e.httpStatus).json({ error: e.message }); return; }
    if (!season) { res.json([]); return; }

    const { data, error } = await supabase
      .from('season_finances')
      .select(FINANCE_COLS)
      .eq('season_id', (season as { id: number }).id)
      .order('category', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    res.json(data ?? []);
  } catch (err) {
    console.error('[GET /finances/current]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /finances/season/:id — público (legado)
router.get('/season/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { data, error } = await supabase
      .from('season_finances')
      .select(FINANCE_COLS)
      .eq('season_id', id)
      .order('category', { ascending: true });

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
    res.json(data ?? []);
  } catch (err) {
    console.error('[GET /finances/season/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /finances — master: criar entrada (legado)
router.post('/', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { season_id, category, label, amount_brl, goal_brl } = req.body as {
    season_id?:  number;
    category?:   string;
    label?:      string;
    amount_brl?: number;
    goal_brl?:   number | null;
  };

  if (!season_id || isNaN(Number(season_id))) {
    res.status(400).json({ error: 'season_id inválido.' }); return;
  }
  if (!category || !VALID_CATEGORIES.includes(category as FinanceCategory)) {
    res.status(400).json({ error: 'Categoria inválida.' }); return;
  }
  if (!label?.trim()) {
    res.status(400).json({ error: 'Label é obrigatório.' }); return;
  }
  if (typeof amount_brl !== 'number') {
    res.status(400).json({ error: 'amount_brl deve ser um número.' }); return;
  }

  try {
    const { data, error } = await supabase
      .from('season_finances')
      .insert([{
        season_id: Number(season_id),
        category,
        label: label.trim(),
        amount_brl,
        goal_brl: goal_brl ?? null,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(201).json(data);
  } catch (err) {
    console.error('[POST /finances]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /finances/:id — master: atualizar entrada (legado)
router.patch('/:id(\\d+)', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const { category, label, amount_brl, goal_brl } = req.body as {
    category?:   string;
    label?:      string;
    amount_brl?: number;
    goal_brl?:   number | null;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category as FinanceCategory)) {
      res.status(400).json({ error: 'Categoria inválida.' }); return;
    }
    patch.category = category;
  }
  if (label !== undefined) {
    if (!label.trim()) { res.status(400).json({ error: 'Label não pode ser vazio.' }); return; }
    patch.label = label.trim();
  }
  if (amount_brl !== undefined) {
    if (typeof amount_brl !== 'number') { res.status(400).json({ error: 'amount_brl deve ser um número.' }); return; }
    patch.amount_brl = amount_brl;
  }
  if ('goal_brl' in req.body) patch.goal_brl = goal_brl ?? null;

  try {
    const { data, error } = await supabase
      .from('season_finances')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /finances/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /finances/:id — master (legado)
router.delete('/:id(\\d+)', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { error } = await supabase
      .from('season_finances')
      .delete()
      .eq('id', id);

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /finances/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── Sistema novo de transparência financeira ─────────────────────────────────

// GET /finances/transparency — público: dados estruturados de transparência
router.get('/transparency', async (req: Request, res: Response): Promise<void> => {
  const seasonParam = req.query.season as string | undefined;

  try {
    // Buscar temporada
    let season: { id: number; name?: string } | null = null;
    if (seasonParam && seasonParam !== 'current') {
      const sid = parseInt(seasonParam, 10);
      if (isNaN(sid)) { res.status(400).json({ error: 'Parâmetro season inválido.' }); return; }
      const { data } = await supabase.from('seasons').select('id, name').eq('id', sid).maybeSingle();
      season = data as { id: number; name?: string } | null;
    } else {
      const { data } = await supabase.from('seasons').select('id, name').eq('is_active', true).maybeSingle();
      season = data as { id: number; name?: string } | null;
    }

    if (!season) {
      res.json({
        season: null,
        summary: { amountRaised: 0, targetAmount: 0, remainingAmount: 0, progressPercent: 0, operationalExpenses: 0, organizationContribution: 0 },
        prizeFund: { currentAmount: 0, targetAmount: 0, locked: true, distributionStatus: 'draft' },
        resourceSources: [], expenses: [], transactions: [], prizeDistribution: [], partners: [],
        lastUpdatedAt: new Date().toISOString(),
      });
      return;
    }

    // Buscar dados em paralelo
    const [pfRes, txRes, distRes] = await Promise.all([
      supabase.from('prize_fund').select('*').eq('season_id', season.id).maybeSingle(),
      supabase.from('financial_transactions').select('*').eq('season_id', season.id).eq('is_public', true).is('deleted_at', null).order('transaction_date', { ascending: false }),
      supabase.from('prize_distribution').select('*').eq('season_id', season.id).order('position', { ascending: true }),
    ]);

    const prizeFundRow = pfRes.data as PrizeFundRow | null;
    const txList = (txRes.data ?? []) as FinTx[];
    const distList = (distRes.data ?? []) as PrizeDistRow[];

    // Calcular valores do fundo de premiação
    const prizeIncomes  = txList.filter(t => bool(t.is_prize_fund) && t.type === 'income');
    const prizeExpenses = txList.filter(t => bool(t.is_prize_fund) && t.type === 'expense');
    const amountRaised  = prizeIncomes.reduce((s, t) => s + Number(t.amount_brl), 0)
                        - prizeExpenses.reduce((s, t) => s + Number(t.amount_brl), 0);

    // Calcular custos operacionais
    const opExpenses = txList.filter(t => !bool(t.is_prize_fund) && t.type === 'expense');
    const totalOp    = opExpenses.reduce((s, t) => s + Number(t.amount_brl), 0);
    const orgContrib = opExpenses.filter(t => t.funding_source === 'organization')
                                 .reduce((s, t) => s + Number(t.amount_brl), 0);

    const targetAmount   = Number(prizeFundRow?.target_amount_brl ?? 0);
    const opTargetAmount = Number(prizeFundRow?.op_target_amount_brl ?? 0);

    // Origem dos recursos (categorias das entradas do fundo)
    const sourceMap = new Map<string, number>();
    prizeIncomes.forEach(t => {
      sourceMap.set(t.category, (sourceMap.get(t.category) ?? 0) + Number(t.amount_brl));
    });

    // Last updated: transação mais recente ou updated_at do prize_fund
    const lastUpdatedAt = txList[0]?.updated_at ?? prizeFundRow?.updated_at ?? new Date().toISOString();

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    res.json({
      season: { id: season.id, name: season.name ?? `Temporada ${season.id}` },
      summary: {
        amountRaised,
        targetAmount,
        remainingAmount:          Math.max(0, targetAmount - amountRaised),
        progressPercent:          targetAmount > 0 ? Math.round((amountRaised / targetAmount) * 100) : 0,
        operationalExpenses:      totalOp,
        organizationContribution: orgContrib,
      },
      prizeFund: {
        currentAmount:      amountRaised,
        targetAmount,
        opTargetAmount,
        locked:             bool(prizeFundRow?.locked ?? true),
        distributionStatus: prizeFundRow?.distribution_status ?? 'draft',
      },
      resourceSources: Array.from(sourceMap.entries()).map(([category, amount]) => ({ category, amount })),
      expenses: opExpenses.map(t => ({
        category:      t.category,
        description:   t.description,
        amount:        Number(t.amount_brl),
        fundingSource: t.funding_source,
      })),
      transactions: txList.map(t => ({
        id:              t.id,
        type:            t.type,
        category:        t.category,
        description:     t.description,
        amount:          Number(t.amount_brl),
        fundingSource:   t.funding_source,
        isPrizeFund:     bool(t.is_prize_fund),
        transactionDate: t.transaction_date,
      })),
      prizeDistribution: distList.map(d => ({
        position:    d.position,
        percentage:  d.percentage,
        fixedAmount: d.fixed_amount,
        description: d.description,
      })),
      partners:      [],
      lastUpdatedAt,
    });
  } catch (err) {
    console.error('[GET /finances/transparency]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /finances/transactions — master: criar transação
router.post('/transactions', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { season_id, type, category, description, amount_brl, funding_source, is_prize_fund, is_public, transaction_date } = req.body as {
    season_id?:       number;
    type?:            string;
    category?:        string;
    description?:     string;
    amount_brl?:      number;
    funding_source?:  string;
    is_prize_fund?:   boolean;
    is_public?:       boolean;
    transaction_date?: string;
  };

  if (!season_id || isNaN(Number(season_id))) { res.status(400).json({ error: 'season_id inválido.' }); return; }
  if (!type || !VALID_TX_TYPES.includes(type as TxType)) { res.status(400).json({ error: 'Tipo inválido.' }); return; }
  if (!category?.trim()) { res.status(400).json({ error: 'Categoria é obrigatória.' }); return; }
  if (!description?.trim()) { res.status(400).json({ error: 'Descrição é obrigatória.' }); return; }
  if (typeof amount_brl !== 'number' || amount_brl < 0) { res.status(400).json({ error: 'amount_brl deve ser um número positivo.' }); return; }
  if (funding_source && !VALID_FUNDING.includes(funding_source as FundingSource)) { res.status(400).json({ error: 'funding_source inválido.' }); return; }
  if (!transaction_date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)) { res.status(400).json({ error: 'transaction_date deve estar no formato YYYY-MM-DD.' }); return; }

  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase.from('financial_transactions').insert([{
      season_id:       Number(season_id),
      type,
      category:        category.trim(),
      description:     description.trim(),
      amount_brl,
      funding_source:  funding_source ?? 'organization',
      is_prize_fund:   is_prize_fund ?? false,
      is_public:       is_public ?? true,
      transaction_date,
      created_at:      now,
      updated_at:      now,
    }]).select().single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(201).json(data);
  } catch (err) {
    console.error('[POST /finances/transactions]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /finances/transactions/:id — master: atualizar transação
router.patch('/transactions/:id', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  const body = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ('type' in body) {
    if (!VALID_TX_TYPES.includes(body.type as TxType)) { res.status(400).json({ error: 'Tipo inválido.' }); return; }
    patch.type = body.type;
  }
  if ('category' in body) {
    if (!(body.category as string)?.trim()) { res.status(400).json({ error: 'Categoria não pode ser vazia.' }); return; }
    patch.category = (body.category as string).trim();
  }
  if ('description' in body) {
    if (!(body.description as string)?.trim()) { res.status(400).json({ error: 'Descrição não pode ser vazia.' }); return; }
    patch.description = (body.description as string).trim();
  }
  if ('amount_brl' in body) {
    if (typeof body.amount_brl !== 'number' || body.amount_brl < 0) { res.status(400).json({ error: 'amount_brl deve ser um número positivo.' }); return; }
    patch.amount_brl = body.amount_brl;
  }
  if ('funding_source' in body) {
    if (!VALID_FUNDING.includes(body.funding_source as FundingSource)) { res.status(400).json({ error: 'funding_source inválido.' }); return; }
    patch.funding_source = body.funding_source;
  }
  if ('is_prize_fund' in body) patch.is_prize_fund = body.is_prize_fund;
  if ('is_public' in body) patch.is_public = body.is_public;
  if ('transaction_date' in body) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.transaction_date as string)) { res.status(400).json({ error: 'transaction_date inválido.' }); return; }
    patch.transaction_date = body.transaction_date;
  }

  try {
    const { data, error } = await supabase.from('financial_transactions').update(patch).eq('id', id).select().single();
    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PATCH /finances/transactions/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /finances/transactions/:id — master: soft delete
router.delete('/transactions/:id', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido.' }); return; }

  try {
    const { error } = await supabase.from('financial_transactions')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /finances/transactions/:id]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /finances/prize-fund — master: criar ou atualizar configuração do fundo
router.put('/prize-fund', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { season_id, target_amount_brl, op_target_amount_brl, locked, distribution_status } = req.body as {
    season_id?:             number;
    target_amount_brl?:     number;
    op_target_amount_brl?:  number;
    locked?:                boolean;
    distribution_status?:   string;
  };

  if (!season_id || isNaN(Number(season_id))) { res.status(400).json({ error: 'season_id inválido.' }); return; }
  if (target_amount_brl !== undefined && (typeof target_amount_brl !== 'number' || target_amount_brl < 0)) {
    res.status(400).json({ error: 'target_amount_brl deve ser um número positivo.' }); return;
  }
  if (op_target_amount_brl !== undefined && (typeof op_target_amount_brl !== 'number' || op_target_amount_brl < 0)) {
    res.status(400).json({ error: 'op_target_amount_brl deve ser um número positivo.' }); return;
  }
  if (distribution_status && !VALID_DIST_STATUS.includes(distribution_status as typeof VALID_DIST_STATUS[number])) {
    res.status(400).json({ error: 'distribution_status inválido.' }); return;
  }

  try {
    const { data, error } = await supabase.from('prize_fund').upsert([{
      season_id:            Number(season_id),
      target_amount_brl:    target_amount_brl ?? 1000,
      op_target_amount_brl: op_target_amount_brl ?? 0,
      locked:               locked ?? true,
      distribution_status:  distribution_status ?? 'draft',
      updated_at:           new Date().toISOString(),
    }], { onConflict: 'season_id' }).select().single();

    if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    res.json(data);
  } catch (err) {
    console.error('[PUT /finances/prize-fund]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /finances/prize-distribution — master: substituir distribuição completa
router.put('/prize-distribution', requireMaster, async (req: ModRequest, res: Response): Promise<void> => {
  const { season_id, distribution } = req.body as {
    season_id?:    number;
    distribution?: { position: number; percentage?: number | null; fixed_amount?: number | null; description?: string | null }[];
  };

  if (!season_id || isNaN(Number(season_id))) { res.status(400).json({ error: 'season_id inválido.' }); return; }
  if (!Array.isArray(distribution)) { res.status(400).json({ error: 'distribution deve ser um array.' }); return; }

  try {
    // Apagar distribuição existente
    await supabase.from('prize_distribution').delete().eq('season_id', Number(season_id));

    if (distribution.length > 0) {
      const rows = distribution.map(d => ({
        season_id:   Number(season_id),
        position:    d.position,
        percentage:  d.percentage ?? null,
        fixed_amount: d.fixed_amount ?? null,
        description: d.description ?? null,
      }));
      const { error } = await supabase.from('prize_distribution').insert(rows);
      if (error) { const e = dbError(error); res.status(e.httpStatus).json({ error: e.message }); return; }
    }

    const { data } = await supabase.from('prize_distribution').select('*').eq('season_id', Number(season_id)).order('position', { ascending: true });
    res.json(data ?? []);
  } catch (err) {
    console.error('[PUT /finances/prize-distribution]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
