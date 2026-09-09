import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetFinancialTransparency } from '../lib/api';
import type { FinancialTransparencyData, FinancialTransaction, PrizeDistributionItem } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBrl(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function fmtDateShort(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
}

// ── Labels ───────────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  donations:   'Doações',
  advertising: 'Publicidade',
  adsense:     'Google AdSense',
  sponsorship: 'Patrocínios',
  sponsor:     'Patrocínios',
  supporters:  'Apoiadores',
  community:   'Apoio da Comunidade',
  other:       'Outros',
};

const EXPENSE_LABEL: Record<string, string> = {
  hosting:       'Hospedagem',
  vps:           'VPS',
  domain:        'Domínio',
  infrastructure:'Infraestrutura',
  services:      'Serviços',
  tools:         'Ferramentas',
  development:   'Desenvolvimento',
  media:         'Mídia',
  other:         'Outros',
};

const FUNDING_SOURCE_LABEL: Record<string, string> = {
  organization:     'Pago pela organização',
  operational_fund: 'Fundo operacional',
  sponsor:          'Pago por patrocinador',
  prize_fund:       'Fundo de premiação',
  other:            'Outros',
};

const DIST_STATUS_LABEL: Record<string, string> = {
  draft:     'Não definida',
  defined:   'Definida',
  published: 'Publicada',
  paid:      'Paga',
};

const TX_TYPE_LABEL: Record<string, string> = {
  income:     'Entrada',
  expense:    'Despesa',
  adjustment: 'Ajuste',
};

function catLabel(category: string): string {
  return SOURCE_LABEL[category] ?? EXPENSE_LABEL[category] ?? category;
}

// ── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: FinancialTransparencyData['summary'] }) {
  const { amountRaised, targetAmount, remainingAmount, progressPercent, operationalExpenses, organizationContribution } = summary;
  const exceeded = progressPercent >= 100;

  const cards = [
    {
      key: 'prize',
      icon: 'ti-trophy',
      title: 'Fundo de Premiação',
      value: fmtBrl(amountRaised),
      desc: 'Valor arrecadado para o fundo',
    },
    {
      key: 'target',
      icon: 'ti-target',
      title: 'Meta da Premiação',
      value: fmtBrl(targetAmount),
      desc: targetAmount > 0 ? `${progressPercent}% atingido` : 'Meta não definida',
    },
    {
      key: 'remaining',
      icon: exceeded ? 'ti-star' : 'ti-arrow-up',
      title: 'Falta para a Meta',
      value: exceeded ? 'Meta atingida!' : fmtBrl(remainingAmount),
      desc: exceeded ? `${progressPercent}% — meta superada` : 'Para completar o fundo',
    },
    {
      key: 'ops',
      icon: 'ti-server',
      title: 'Custos Operacionais',
      value: fmtBrl(operationalExpenses),
      desc: organizationContribution > 0 ? 'Custeados pela organização' : 'Infraestrutura e serviços',
    },
  ];

  return (
    <div className="transp-summary-grid">
      {cards.map(c => (
        <div key={c.key} className={`transp-summary-card transp-sc--${c.key}`}>
          <div className="transp-sc-icon"><i className={`ti ${c.icon}`} /></div>
          <div className="transp-sc-body">
            <div className="transp-sc-title">{c.title}</div>
            <div className="transp-sc-value">{c.value}</div>
            <div className="transp-sc-desc">{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Prize Fund ───────────────────────────────────────────────────────────────

function PrizeFundSection({ prizeFund }: { prizeFund: FinancialTransparencyData['prizeFund'] }) {
  const { currentAmount, targetAmount, locked, distributionStatus } = prizeFund;
  const pct     = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
  const exceeded = currentAmount > targetAmount && targetAmount > 0;

  return (
    <section className="transp-card transp-card--prize">
      <div className="transp-card-header">
        <i className="ti ti-trophy" />
        <h2>Fundo de Premiação</h2>
        <div className="transp-header-badges">
          {locked && (
            <span className="transp-badge transp-badge--locked">
              <i className="ti ti-lock" /> Protegido
            </span>
          )}
          <span className={`transp-badge transp-badge--dist-${distributionStatus}`}>
            {DIST_STATUS_LABEL[distributionStatus] ?? distributionStatus}
          </span>
        </div>
      </div>
      <div className="transp-prize-body">
        <div className="transp-prize-amounts">
          <span className="transp-prize-current">{fmtBrl(currentAmount)}</span>
          {targetAmount > 0 && (
            <>
              <span className="transp-prize-sep">/</span>
              <span className="transp-prize-goal">{fmtBrl(targetAmount)}</span>
            </>
          )}
        </div>
        {targetAmount > 0 && (
          <>
            <div className="transp-prize-bar-wrap">
              <div className="transp-prize-bar-fill" style={{ width: `${pct.toFixed(1)}%` }} />
            </div>
            <div className="transp-prize-stats">
              <span className="transp-prize-pct">
                {exceeded ? 'Meta superada!' : `${Math.round(pct)}% atingido`}
              </span>
              {!exceeded && targetAmount > currentAmount && (
                <span className="transp-prize-remaining">
                  Faltam {fmtBrl(targetAmount - currentAmount)}
                </span>
              )}
            </div>
          </>
        )}
        {locked && (
          <p className="transp-prize-note">
            <i className="ti ti-shield-check" /> O fundo de premiação é protegido e não pode ser usado para custos operacionais.
          </p>
        )}
      </div>
    </section>
  );
}

// ── Resource Sources ─────────────────────────────────────────────────────────

function ResourcesSection({ sources, total }: { sources: FinancialTransparencyData['resourceSources']; total: number }) {
  return (
    <section className="transp-card">
      <div className="transp-card-header">
        <i className="ti ti-trending-up" />
        <h2>Origem dos Recursos</h2>
      </div>
      {sources.length === 0 ? (
        <p className="transp-empty-inline">Nenhuma entrada registrada no fundo de premiação.</p>
      ) : (
        <>
          <div className="transp-entries">
            {sources.map(s => (
              <div key={s.category} className="transp-entry">
                <span className="transp-entry-label">
                  <span className="transp-entry-cat">{SOURCE_LABEL[s.category] ?? s.category}</span>
                </span>
                <span className="transp-entry-value transp-entry-value--income">+ {fmtBrl(s.amount)}</span>
              </div>
            ))}
          </div>
          <div className="transp-total-row">
            <span>Total arrecadado</span>
            <span className="transp-total-value transp-entry-value--income">{fmtBrl(total)}</span>
          </div>
        </>
      )}
    </section>
  );
}

// ── Operational Expenses ─────────────────────────────────────────────────────

function ExpensesSection({ expenses }: { expenses: FinancialTransparencyData['expenses'] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <section className="transp-card">
      <div className="transp-card-header">
        <i className="ti ti-server" />
        <h2>Custos Operacionais</h2>
      </div>
      {expenses.length === 0 ? (
        <p className="transp-empty-inline">Nenhuma despesa registrada.</p>
      ) : (
        <>
          <div className="transp-entries">
            {expenses.map((e, i) => (
              <div key={i} className="transp-entry">
                <span className="transp-entry-label">
                  <span className="transp-entry-cat">{EXPENSE_LABEL[e.category] ?? e.category}</span>
                  {e.description && <span className="transp-entry-detail">{e.description}</span>}
                  <span className="transp-funding-tag">{FUNDING_SOURCE_LABEL[e.fundingSource] ?? e.fundingSource}</span>
                </span>
                <span className="transp-entry-value transp-entry-value--expense">- {fmtBrl(e.amount)}</span>
              </div>
            ))}
          </div>
          <div className="transp-total-row">
            <span>Total de despesas</span>
            <span className="transp-total-value transp-entry-value--expense">{fmtBrl(total)}</span>
          </div>
        </>
      )}
    </section>
  );
}

// ── Transaction History ───────────────────────────────────────────────────────

type HistoryFilter = 'all' | 'income' | 'expense' | 'prize' | 'operational';

const HISTORY_FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all',         label: 'Tudo' },
  { key: 'income',      label: 'Entradas' },
  { key: 'expense',     label: 'Despesas' },
  { key: 'prize',       label: 'Fundo' },
  { key: 'operational', label: 'Operacional' },
];

function HistorySection({ transactions }: { transactions: FinancialTransaction[] }) {
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filtered = transactions.filter(t => {
    if (filter === 'income')      return t.type === 'income';
    if (filter === 'expense')     return t.type === 'expense';
    if (filter === 'prize')       return t.isPrizeFund;
    if (filter === 'operational') return !t.isPrizeFund;
    return true;
  });

  const txIcon = (type: string) =>
    type === 'income' ? 'ti-arrow-up' : type === 'expense' ? 'ti-arrow-down' : 'ti-adjustments';

  return (
    <section className="transp-card">
      <div className="transp-card-header">
        <i className="ti ti-history" />
        <h2>Histórico Financeiro</h2>
      </div>
      <div className="transp-filter-bar">
        {HISTORY_FILTERS.map(f => (
          <button
            key={f.key}
            className={`transp-filter-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {transactions.length === 0 ? (
        <p className="transp-empty-inline">Nenhuma movimentação registrada nesta temporada.</p>
      ) : filtered.length === 0 ? (
        <p className="transp-empty-inline">Nenhuma movimentação nesta categoria.</p>
      ) : (
        <div className="transp-tx-list">
          {filtered.map(t => (
            <div key={t.id} className={`transp-tx-row transp-tx--${t.type}`}>
              <div className="transp-tx-icon">
                <i className={`ti ${txIcon(t.type)}`} aria-hidden="true" />
              </div>
              <div className="transp-tx-info">
                <span className="transp-tx-desc">{t.description}</span>
                <span className="transp-tx-meta">
                  {TX_TYPE_LABEL[t.type] ?? t.type} · {catLabel(t.category)}
                  {' · '}{t.isPrizeFund ? 'Fundo de premiação' : 'Operacional'}
                </span>
              </div>
              <div className="transp-tx-right">
                <span className={`transp-tx-amount transp-tx-amount--${t.type}`}>
                  {t.type === 'income' ? '+ ' : '- '}{fmtBrl(t.amount)}
                </span>
                <span className="transp-tx-date">{fmtDateShort(t.transactionDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Prize Distribution ───────────────────────────────────────────────────────

const POS_META: Record<number, { icon: string; color: string }> = {
  1: { icon: '🥇', color: '#c8a84b' },
  2: { icon: '🥈', color: '#9099a5' },
  3: { icon: '🥉', color: '#a0623a' },
};

function PrizeDistSection({
  distribution,
  status,
  currentAmount,
}: {
  distribution: PrizeDistributionItem[];
  status: string;
  currentAmount: number;
}) {
  return (
    <section className="transp-card">
      <div className="transp-card-header">
        <i className="ti ti-award" />
        <h2>Distribuição da Premiação</h2>
        <span className={`transp-badge transp-badge--dist-${status} transp-badge--ml`}>
          {DIST_STATUS_LABEL[status] ?? status}
        </span>
      </div>
      {distribution.length === 0 ? (
        <p className="transp-empty-inline">A distribuição da premiação será publicada antes do encerramento da temporada.</p>
      ) : (
        <div className="transp-dist-list">
          {distribution.map(d => {
            const meta   = POS_META[d.position] ?? { icon: '🏅', color: 'var(--text-3)' };
            const amount = d.fixedAmount != null
              ? d.fixedAmount
              : d.percentage != null && currentAmount > 0
                ? (currentAmount * d.percentage) / 100
                : null;
            return (
              <div key={d.position} className="transp-dist-row">
                <span className="transp-dist-pos" style={{ color: meta.color }}>
                  {meta.icon} {d.position}º lugar
                </span>
                <div className="transp-dist-right">
                  {d.percentage != null && (
                    <span className="transp-dist-pct">{d.percentage}%</span>
                  )}
                  {amount != null && (
                    <span className="transp-dist-amount" style={{ color: meta.color }}>
                      {fmtBrl(amount)}
                    </span>
                  )}
                  {d.description && <span className="transp-dist-desc">{d.description}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Commitment ───────────────────────────────────────────────────────────────

function CommitmentCard({ locked }: { locked: boolean }) {
  return (
    <section className="transp-card transp-card--commitment">
      <div className="transp-card-header">
        <i className="ti ti-shield-check" />
        <h2>Compromisso com a Comunidade</h2>
      </div>
      <div className="transp-commitment-body">
        <p>
          O apoio financeiro ao Brasileirão PZ <strong>não concede qualquer vantagem competitiva</strong>.
          Parceiros, patrocinadores, apoiadores e jogadores seguem exatamente as mesmas regras da competição.
        </p>
        {locked && (
          <p>
            Os recursos destinados ao <strong>Fundo de Premiação não são utilizados para custos operacionais</strong>.
            O fundo é protegido e exclusivo para a premiação dos vencedores.
          </p>
        )}
        <p>
          O Brasileirão PZ é um projeto independente voltado à comunidade.
          O projeto não possui como objetivo principal a geração de lucro.
        </p>
      </div>
    </section>
  );
}

// ── Sponsor CTA ──────────────────────────────────────────────────────────────

function SponsorCTA() {
  return (
    <section className="transp-card transp-card--sponsor-cta">
      <div className="transp-card-header">
        <i className="ti ti-speakerphone" />
        <h2>Quer anunciar ou patrocinar?</h2>
      </div>
      <p className="transp-sponsor-desc">
        Seu anúncio aparece para toda a comunidade do Brasileirão PZ — jogadores ativos,
        streamers e entusiastas de Project Zomboid no Brasil.
        Entre em contato e vamos conversar!
      </p>
      <a href="mailto:brasileiraozomboid@gmail.com" className="btn-sponsor-contact">
        <i className="ti ti-mail" aria-hidden="true" />
        brasileiraozomboid@gmail.com
      </a>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'O fundo de premiação pode ser usado para pagar despesas operacionais?',
    a: 'Não. O fundo de premiação é protegido e exclusivo para a premiação dos vencedores da temporada. Custos operacionais como hospedagem, infraestrutura e serviços são custeados separadamente pela organização.',
  },
  {
    q: 'Como sei que os dados financeiros são confiáveis?',
    a: 'Os dados são declarados e atualizados manualmente pelos organizadores do Brasileirão PZ. Toda movimentação é publicada nesta página de forma transparente e auditável pela comunidade.',
  },
  {
    q: 'Como posso apoiar ou patrocinar o campeonato?',
    a: 'Entre em contato pelo e-mail brasileiraozomboid@gmail.com para saber sobre oportunidades de patrocínio, publicidade ou apoio à comunidade.',
  },
  {
    q: 'O Brasileirão PZ tem fins lucrativos?',
    a: 'Não. O projeto é independente e voltado à comunidade. O objetivo principal não é a geração de lucro — todos os recursos arrecadados para o fundo de premiação são destinados aos vencedores da temporada.',
  },
  {
    q: 'Minha doação ou contribuição permanece anônima?',
    a: 'Sim. A página trabalha por categorias de origem (doações, publicidade, patrocínios) sem expor nomes individuais. Somente contribuidores que derem consentimento explícito terão seus nomes exibidos.',
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="transp-card">
      <div className="transp-card-header">
        <i className="ti ti-help-circle" />
        <h2>Perguntas Frequentes</h2>
      </div>
      <div className="transp-faq">
        {FAQ.map((item, i) => (
          <div key={i} className="transp-faq-item">
            <button
              className="transp-faq-q"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{item.q}</span>
              <i className={`ti ${open === i ? 'ti-chevron-up' : 'ti-chevron-down'}`} aria-hidden="true" />
            </button>
            {open === i && <p className="transp-faq-a">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function TransparenciaPage() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<FinancialTransparencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    apiGetFinancialTransparency()
      .then(setData)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const isEmpty = !loading && !error && (!data || !data.season);

  return (
    <div className="transp-page">
      <header className="transp-header">
        <div className="container transp-header-inner">
          <button type="button" className="btn-primary btn-sm" onClick={() => navigate(-1)}>
            <i className="ti ti-arrow-left" /> Voltar
          </button>
          <div className="transp-header-text">
            <h1 className="transp-title">Transparência Financeira</h1>
            <p className="transp-subtitle">Prestação de contas oficial da temporada atual.</p>
            {data?.season && (
              <div className="transp-meta-row">
                <span className="transp-season-badge">
                  <i className="ti ti-calendar" /> {data.season.name}
                </span>
                <span className="transp-last-updated">
                  <i className="ti ti-clock" /> Atualizado em {fmtDateTime(data.lastUpdatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container transp-main">

        {loading && (
          <div className="transp-loading">
            <i className="ti ti-loader-2 spin" /> Carregando dados financeiros...
          </div>
        )}

        {error && (
          <div className="transp-error-state">
            <i className="ti ti-alert-circle" />
            <div>
              <p>Não foi possível carregar os dados financeiros.</p>
              <button type="button" className="btn-primary btn-sm" onClick={load} style={{ marginTop: '12px' }}>
                <i className="ti ti-refresh" /> Recarregar
              </button>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="transp-empty">
            <i className="ti ti-chart-pie" />
            <p>Nenhum dado financeiro disponível para esta temporada.</p>
          </div>
        )}

        {!loading && !error && data && data.season && (
          <>
            <SummaryCards summary={data.summary} />

            <PrizeFundSection prizeFund={data.prizeFund} />

            <div className="transp-two-col">
              <ResourcesSection sources={data.resourceSources} total={data.summary.amountRaised} />
              <ExpensesSection expenses={data.expenses} />
            </div>

            <HistorySection transactions={data.transactions} />

            <PrizeDistSection
              distribution={data.prizeDistribution}
              status={data.prizeFund.distributionStatus}
              currentAmount={data.prizeFund.currentAmount}
            />

            <CommitmentCard locked={data.prizeFund.locked} />

            <SponsorCTA />

            <FaqSection />
          </>
        )}
      </main>
    </div>
  );
}
