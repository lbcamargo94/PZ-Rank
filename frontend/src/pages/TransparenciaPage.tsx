import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetCurrentFinances } from '../lib/api';
import type { FinanceEntry, FinanceCategory } from '../types';

const CATEGORY_LABEL: Record<FinanceCategory, string> = {
  hosting:    'Hospedagem',
  prize:      'Premiação',
  domain:     'Domínio',
  adsense:    'Google AdSense',
  supporters: 'Apoiadores',
  sponsor:    'Patrocínios',
  other:      'Outros',
};

function fmtBrl(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function sum(entries: FinanceEntry[]): number {
  return entries.reduce((acc, e) => acc + e.amount_brl, 0);
}

export function TransparenciaPage() {
  const [entries,  setEntries]  = useState<FinanceEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    apiGetCurrentFinances()
      .then(setEntries)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const prize      = entries.filter(e => e.category === 'prize');
  const revenue    = entries.filter(e => ['adsense', 'supporters', 'sponsor'].includes(e.category));
  const expenses   = entries.filter(e => ['hosting', 'domain', 'other'].includes(e.category));

  const totalRevenue  = sum(revenue);
  const totalExpenses = sum(expenses);
  const prizeEntry    = prize[0] ?? null;

  return (
    <div className="transp-page">
      <header className="transp-header">
        <Link to="/" className="transp-back">
          <i className="ti ti-arrow-left" /> Voltar ao Ranking
        </Link>
        <h1 className="transp-title">Transparência Financeira</h1>
        <p className="transp-subtitle">
          Temporada atual · Valores declarados manualmente pelos organizadores
        </p>
      </header>

      <main className="container transp-main">
        {loading && (
          <div className="transp-loading">
            <i className="ti ti-loader-2 spin" /> Carregando dados financeiros...
          </div>
        )}

        {error && (
          <div className="transp-error">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="transp-empty">
            <i className="ti ti-chart-pie" />
            <p>Nenhum dado financeiro disponível para esta temporada.</p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            {/* Premiação */}
            {prizeEntry && (
              <section className="transp-card transp-card--prize">
                <div className="transp-card-header">
                  <i className="ti ti-trophy" />
                  <h2>Premiação</h2>
                </div>
                <div className="transp-prize-amounts">
                  <span className="transp-prize-current">{fmtBrl(prizeEntry.amount_brl)}</span>
                  {prizeEntry.goal_brl && (
                    <span className="transp-prize-goal">meta: {fmtBrl(prizeEntry.goal_brl)}</span>
                  )}
                </div>
                {prizeEntry.goal_brl && (
                  <div className="transp-prize-bar-wrap">
                    <div
                      className="transp-prize-bar-fill"
                      style={{ width: `${Math.min(100, (prizeEntry.amount_brl / prizeEntry.goal_brl) * 100).toFixed(1)}%` }}
                    />
                  </div>
                )}
                {prizeEntry.goal_brl && (
                  <p className="transp-prize-pct">
                    {((prizeEntry.amount_brl / prizeEntry.goal_brl) * 100).toFixed(0)}% da meta atingida
                  </p>
                )}
                <p className="transp-prize-label">{prizeEntry.label}</p>
              </section>
            )}

            {/* Receitas */}
            {revenue.length > 0 && (
              <section className="transp-card">
                <div className="transp-card-header">
                  <i className="ti ti-trending-up" />
                  <h2>Receitas</h2>
                </div>
                <div className="transp-entries">
                  {revenue.map(e => (
                    <div key={e.id} className="transp-entry">
                      <span className="transp-entry-label">
                        <span className={`transp-entry-cat transp-cat--${e.category}`}>
                          {CATEGORY_LABEL[e.category]}
                        </span>
                        {e.label !== CATEGORY_LABEL[e.category] && (
                          <span className="transp-entry-detail">{e.label}</span>
                        )}
                      </span>
                      <span className="transp-entry-value transp-entry-value--income">
                        {fmtBrl(e.amount_brl)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="transp-total-row">
                  <span>Total de receitas</span>
                  <span className="transp-total-value transp-entry-value--income">{fmtBrl(totalRevenue)}</span>
                </div>
              </section>
            )}

            {/* Despesas */}
            {expenses.length > 0 && (
              <section className="transp-card">
                <div className="transp-card-header">
                  <i className="ti ti-trending-down" />
                  <h2>Despesas</h2>
                </div>
                <div className="transp-entries">
                  {expenses.map(e => (
                    <div key={e.id} className="transp-entry">
                      <span className="transp-entry-label">
                        <span className={`transp-entry-cat transp-cat--${e.category}`}>
                          {CATEGORY_LABEL[e.category]}
                        </span>
                        {e.label !== CATEGORY_LABEL[e.category] && (
                          <span className="transp-entry-detail">{e.label}</span>
                        )}
                      </span>
                      <span className="transp-entry-value transp-entry-value--expense">
                        {fmtBrl(e.amount_brl)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="transp-total-row">
                  <span>Total de despesas</span>
                  <span className="transp-total-value transp-entry-value--expense">{fmtBrl(totalExpenses)}</span>
                </div>
              </section>
            )}

            {/* Nota */}
            <div className="transp-note">
              <i className="ti ti-heart-filled" />
              <p>
                Cada anúncio e apoio vai diretamente para o fundo de premiação do campeonato.
                Este projeto é mantido com amor pela comunidade — sem fins lucrativos.
              </p>
            </div>

            {/* CTA patrocínio */}
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
              <a
                href="mailto:brasileiraozomboid@gmail.com"
                className="btn-sponsor-contact"
              >
                <i className="ti ti-mail" aria-hidden="true" />
                brasileiraozomboid@gmail.com
              </a>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
