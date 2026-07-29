import { useEffect, useState } from 'react';
import { apiGetLatestNews } from '../lib/api';
import type { DailyNews, NewsStats } from '../types';

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtDateLong(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

function autoHeadline(s: NewsStats): string {
  if (s.deaths_today > 0 && s.kills_today > 0) {
    const d = s.deaths_today;
    return `${d} sobrevivente${d > 1 ? 's' : ''} tombou${d > 1 ? 'ram' : ''} hoje — ${fmt(s.kills_today)} zumbis eliminados nas últimas 24 horas.`;
  }
  if (s.deaths_today > 0) {
    const d = s.deaths_today;
    return `${d} sobrevivente${d > 1 ? 's' : ''} tombou${d > 1 ? 'ram' : ''} hoje. ${fmt(s.alive_count)} ainda resistem.`;
  }
  if (s.kills_today > 0) {
    return `${fmt(s.kills_today)} zumbis eliminados hoje. ${fmt(s.alive_count)} sobreviventes seguem firmes.`;
  }
  if (s.syncs_today > 0) {
    const a = s.syncs_today;
    return `${a} jogador${a > 1 ? 'es' : ''} ativo${a > 1 ? 's' : ''} hoje. O apocalipse continua.`;
  }
  return `${fmt(s.alive_count)} sobrevivente${s.alive_count !== 1 ? 's' : ''} resiste${s.alive_count === 1 ? '' : 'm'} ao apocalipse.`;
}

interface ModalProps {
  news:    DailyNews | null;
  loading: boolean;
  onClose: () => void;
}

function NewsModal({ news, loading, onClose }: ModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const stats    = news?.stats ?? null;
  const headline = news?.headline ?? (stats ? autoHeadline(stats) : null);
  const hasActivity = stats && (stats.deaths_today > 0 || stats.syncs_today > 0 || stats.kills_today > 0);

  return (
    <div className="modal-overlay active" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box news-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        {/* Masthead */}
        <div className="news-modal-masthead">
          <span className="news-modal-label"><i className="ti ti-news" /> JORNAL DO APOCALIPSE</span>
          {news && <span className="news-modal-date">{fmtDateLong(news.date)}</span>}
        </div>

        {loading && (
          <div className="news-modal-state">
            <i className="ti ti-loader-2 spin" /> Carregando edição de hoje...
          </div>
        )}

        {!loading && !news && (
          <div className="news-modal-state news-modal-state--error">
            <i className="ti ti-alert-circle" /> Não foi possível carregar o jornal.
          </div>
        )}

        {!loading && news && (
          <>
            {/* Manchete */}
            {headline && (
              <blockquote className="news-modal-headline">{headline}</blockquote>
            )}

            {/* O que aconteceu hoje */}
            {hasActivity ? (
              <div className="news-modal-section">
                <span className="news-modal-section-label">Aconteceu hoje</span>
                <div className="news-today-grid">
                  {stats!.kills_today > 0 && (
                    <div className="news-today-cell news-today-cell--kills">
                      <i className="ti ti-sword" />
                      <span className="news-today-val">+{fmt(stats!.kills_today)}</span>
                      <span className="news-today-lbl">eliminações</span>
                    </div>
                  )}
                  {stats!.deaths_today > 0 && (
                    <div className="news-today-cell news-today-cell--deaths">
                      <i className="ti ti-skull" />
                      <span className="news-today-val">{stats!.deaths_today}</span>
                      <span className="news-today-lbl">{stats!.deaths_today === 1 ? 'morte' : 'mortes'}</span>
                    </div>
                  )}
                  {stats!.syncs_today > 0 && (
                    <div className="news-today-cell news-today-cell--syncs">
                      <i className="ti ti-users" />
                      <span className="news-today-val">{stats!.syncs_today}</span>
                      <span className="news-today-lbl">{stats!.syncs_today === 1 ? 'ativo' : 'ativos'}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="news-modal-section">
                <span className="news-modal-section-label">Aconteceu hoje</span>
                <p className="news-quiet">Nenhuma atividade registrada hoje.</p>
              </div>
            )}

            {/* Situação atual */}
            {stats && (
              <div className="news-modal-section">
                <span className="news-modal-section-label">Situação atual</span>
                <div className="news-current-row">
                  <span className="news-current-item news-current--alive">
                    <i className="ti ti-heartbeat" />
                    <strong>{fmt(stats.alive_count)}</strong> vivos
                  </span>
                  <span className="news-current-sep" />
                  <span className="news-current-item news-current--dead">
                    <i className="ti ti-skull" />
                    <strong>{fmt(stats.dead_count)}</strong> mortos
                  </span>
                  <span className="news-current-sep" />
                  <span className="news-current-item news-current--kills">
                    <i className="ti ti-sword" />
                    <strong>{fmt(stats.total_kills)}</strong> eliminados no total
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function NewsButton() {
  const [open,    setOpen]    = useState(false);
  const [news,    setNews]    = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    setOpen(true);
    if (!news && !loading) {
      setLoading(true);
      apiGetLatestNews()
        .then(setNews)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }

  return (
    <>
      <button className="news-trigger-btn" onClick={handleOpen}>
        <i className="ti ti-news" />
        Jornal do Apocalipse
        <i className="ti ti-chevron-right news-trigger-arrow" />
      </button>
      {open && (
        <NewsModal news={news} loading={loading} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
