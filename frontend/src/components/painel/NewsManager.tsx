import { useEffect, useState, useCallback } from 'react';
import { apiGetLatestNews, apiGetNewsHistory, apiSetHeadline } from '../../lib/api';
import type { DailyNews, NewsStats } from '../../types';

interface Props {
  token:     string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
  });
}

function StatChips({ stats }: { stats: NewsStats }) {
  return (
    <div className="nm-stats">
      <span className="nm-stat nm-stat--alive"><i className="ti ti-heartbeat" /> {fmt(stats.alive_count)} vivos</span>
      <span className="nm-stat nm-stat--dead"><i className="ti ti-skull" /> {fmt(stats.dead_count)} mortos</span>
      <span className="nm-stat nm-stat--kills"><i className="ti ti-sword" /> {fmt(stats.total_kills)} abatidos</span>
      <span className="nm-stat"><i className="ti ti-refresh" /> {stats.new_syncs_today} syncs hoje</span>
      <span className="nm-stat"><i className="ti ti-skull" /> {stats.deaths_today} mortes hoje</span>
    </div>
  );
}

export function NewsManager({ token, showToast }: Props) {
  const [today,   setToday]   = useState<DailyNews | null>(null);
  const [history, setHistory] = useState<DailyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [draft,   setDraft]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([
        apiGetLatestNews(),
        apiGetNewsHistory(token),
      ]);
      setToday(t);
      setDraft(t.headline ?? '');
      setHistory(h);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!today) return;
    setSaving(true);
    try {
      const updated = await apiSetHeadline(token, today.date, draft.trim() || null);
      setToday(updated);
      showToast('Manchete salva com sucesso.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!today) return;
    setSaving(true);
    try {
      const updated = await apiSetHeadline(token, today.date, null);
      setToday(updated);
      setDraft('');
      showToast('Manchete removida — será gerada automaticamente.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="painel-section">
        <div className="painel-empty-state">
          <i className="ti ti-loader-2 spin" />
          <p>Carregando jornal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="painel-section">
      <div className="painel-section-header">
        <h2><i className="ti ti-news" /> Jornal do Apocalipse</h2>
        <button className="btn-secondary btn-sm" onClick={load}>
          <i className="ti ti-refresh" /> Atualizar
        </button>
      </div>

      {today && (
        <div className="nm-today-card">
          <div className="nm-today-header">
            <span className="nm-today-label">Edição de hoje</span>
            <span className="nm-today-date">{fmtDate(today.date)}</span>
          </div>

          {today.stats && <StatChips stats={today.stats} />}

          <div className="nm-headline-form">
            <label className="nm-form-label" htmlFor="nm-headline-input">
              Manchete do dia
              <span className="nm-form-hint">(deixe vazio para gerar automaticamente)</span>
            </label>
            <textarea
              id="nm-headline-input"
              className="nm-headline-textarea"
              rows={2}
              placeholder="Ex: O servidor bateu novo recorde de kills esta semana..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={280}
            />
            <div className="nm-form-actions">
              <button
                className="btn-primary btn-sm"
                disabled={saving}
                onClick={handleSave}
              >
                <i className="ti ti-check" /> Salvar manchete
              </button>
              {today.headline && (
                <button
                  className="btn-ghost btn-sm"
                  disabled={saving}
                  onClick={handleClear}
                >
                  <i className="ti ti-x" /> Remover
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="nm-history">
          <h3 className="nm-history-title">Últimos 7 dias</h3>
          <div className="nm-history-list">
            {history.map(item => (
              <div key={item.id} className="nm-history-item">
                <div className="nm-history-date">{fmtDate(item.date)}</div>
                {item.headline
                  ? <p className="nm-history-headline"><i className="ti ti-quote" /> {item.headline}</p>
                  : <p className="nm-history-auto">Manchete automática</p>
                }
                {item.stats && (
                  <div className="nm-history-mini">
                    <span><i className="ti ti-heartbeat" /> {fmt(item.stats.alive_count)}</span>
                    <span><i className="ti ti-skull" /> {fmt(item.stats.dead_count)}</span>
                    <span><i className="ti ti-sword" /> {fmt(item.stats.total_kills)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
