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
  const parts: string[] = [];
  if (s.deaths_today === 1)    parts.push('1 sobrevivente tombou hoje');
  else if (s.deaths_today > 1) parts.push(`${s.deaths_today} sobreviventes tombaram hoje`);

  const aliveSync = s.new_syncs_today - s.deaths_today;
  if (aliveSync === 1)    parts.push('1 sync registrado');
  else if (aliveSync > 1) parts.push(`${aliveSync} syncs registrados`);

  if (parts.length === 0) {
    return s.alive_count > 0
      ? `${fmt(s.alive_count)} ${s.alive_count === 1 ? 'sobrevivente resiste' : 'sobreviventes resistem'} ao apocalipse.`
      : 'Nenhuma atividade registrada hoje.';
  }
  return parts.join(' · ') + '.';
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

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box news-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        <div className="news-modal-header">
          <span className="news-modal-label">
            <i className="ti ti-news" /> JORNAL DO APOCALIPSE
          </span>
          {news && (
            <span className="news-modal-date">{fmtDateLong(news.date)}</span>
          )}
        </div>

        {loading && (
          <div className="news-modal-loading">
            <i className="ti ti-loader-2 spin" /> Carregando edição de hoje...
          </div>
        )}

        {!loading && !news && (
          <div className="news-modal-loading">
            <i className="ti ti-alert-circle" /> Não foi possível carregar o jornal.
          </div>
        )}

        {!loading && news && (
          <>
            {headline && (
              <p className="news-modal-headline">&ldquo;{headline}&rdquo;</p>
            )}

            {stats && (
              <div className="news-modal-stats">
                <div className="news-modal-stat news-modal-stat--alive">
                  <i className="ti ti-heartbeat" />
                  <span className="nm-stat-val">{fmt(stats.alive_count)}</span>
                  <span className="nm-stat-lbl">vivos</span>
                </div>
                <div className="news-modal-stat news-modal-stat--dead">
                  <i className="ti ti-skull" />
                  <span className="nm-stat-val">{fmt(stats.dead_count)}</span>
                  <span className="nm-stat-lbl">mortos</span>
                </div>
                <div className="news-modal-stat news-modal-stat--kills">
                  <i className="ti ti-sword" />
                  <span className="nm-stat-val">{fmt(stats.total_kills)}</span>
                  <span className="nm-stat-lbl">abatidos</span>
                </div>
                <div className="news-modal-stat news-modal-stat--sync">
                  <i className="ti ti-refresh" />
                  <span className="nm-stat-val">{stats.new_syncs_today}</span>
                  <span className="nm-stat-lbl">syncs hoje</span>
                </div>
              </div>
            )}

            {stats && stats.deaths_today > 0 && (
              <p className="news-modal-deaths">
                <i className="ti ti-skull" /> {stats.deaths_today} morte{stats.deaths_today > 1 ? 's' : ''} registrada{stats.deaths_today > 1 ? 's' : ''} hoje.
              </p>
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
