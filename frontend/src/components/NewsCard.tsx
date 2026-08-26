import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { apiGetLatestNews } from '../lib/api';
import { formatNumber, formatDate } from '../lib/format';
import type { DailyNews, NewsStats } from '../types';

// Manchetes de lore do jogo — conteúdo de dados (flavor text fixo do universo
// de Project Zomboid), não interface. Fica em português nesta fase do i18n,
// mesma fronteira de escopo de traits.ts/professions.ts/objectives.ts.
const LORE_HEADLINES: ReadonlyArray<{ source: string; text: string }> = [
  { source: 'Knox Knews · 6 jul 1993',          text: 'DOENÇA MISTERIOSA ATINGE MULDRAUGH — Autoridades sobrecarregadas. CDC e militares se mobilizam em silêncio.' },
  { source: 'Kentucky Herald · 6 jul 1993',      text: 'Surto de doença em Muldraugh. Dezenas de casos confirmados. Resposta dificultada pela falta de telefones na região.' },
  { source: 'Louisville Sun Times · 6 jul 1993', text: 'O QUE ESTÁ ACONTECENDO EM MULDRAUGH? CDC em silêncio enquanto militares fecham a área.' },
  { source: 'National Dispatch · 7 jul 1993',    text: 'BLOQUEIO NO KENTUCKY — Militares fecham estradas sem dar explicações. Civis presos dentro do cordão.' },
  { source: 'National Dispatch · 12 jul 1993',   text: 'OMS: "SUSPENDER TODOS OS VOOS". Milhões de viajantes em situação de limbo. Presidente classifica medida como "inoportuna".' },
  { source: 'Kentucky Herald · 13 jul 1993',     text: '"EVENTO KNOX SOB CONTROLE" — Foto vazada levanta questionamentos. Autoridades correm para conter o pânico.' },
  { source: 'National Dispatch · 13 jul 1993',   text: 'IMAGEM SANGRENTA VAZA DA ZONA DE EXCLUSÃO. Bolsas despencam. Guarda Nacional nas ruas das principais cidades.' },
  { source: 'Louisville Sun Times · 13 jul 1993',text: '"VIVO OU MORTO?" — Vírus Knox cria "cadáveres que andam". Toque de recolher nacional durante os distúrbios.' },
  { source: 'Kentucky Herald · 14 jul 1993',     text: '"SEM NECESSIDADE DE PÂNICO" — Gen. McGrew. Vírus degenerativo mas "contido". Presidente deixa Washington.' },
  { source: 'National Dispatch · 14 jul 1993',   text: 'ONU CONDENA RESPOSTA DOS EUA. Vaticano e Meca fecham as portas ao mundo. Governo chinês: "Wall Street acima da humanidade".' },
  { source: 'Louisville Sun Times · 14 jul 1993',text: 'PRESIDENTE ABANDONA WASHINGTON — "VOCÊS ESTÃO POR CONTA PRÓPRIA!" Vírus Knox se espalha por contato com fluidos.' },
  { source: 'Kentucky Herald · 15 jul 1993',     text: 'FRONTEIRA DE KNOX ROMPIDA. Dezenas de soldados e civis mortos. Centenas de infectados derrubam as barricadas.' },
  { source: 'National Dispatch · 15 jul 1993',   text: 'INFECTADOS DOMINAM A FRONTEIRA DE KNOX. Até cem militares mortos. Vírus pode se espalhar pelo ar.' },
  { source: 'Louisville Sun Times · 15 jul 1993',text: 'INFECTADOS ROMPEM BARREIRAS. PÂNICO enquanto civis fogem de Louisville. Prefeito: "Ainda estamos seguros."' },
  { source: 'Kentucky Herald · 16 jul 1993',     text: 'VÍRUS KNOX SE ESPALHA PELO AR. Poucos são imunes à variante aérea. Para os demais, a cura é improvável.' },
  { source: 'Louisville Sun Times · 16 jul 1993',text: 'LOUISVILLE DOMINADA — REZEM POR NÓS. Militares derrotados. Barricade sua casa e carregue sua arma.' },
  { source: 'Kentucky Herald · 16 jul 1993',     text: 'Esta é provavelmente a nossa última edição. Se você é um dos poucos imunes, é você o guardião de um novo mundo.' },
  { source: 'Knox Knews · 4 jul 1993',           text: '"SEM PERIGO AO PÚBLICO" — Caminhão militar com material perigoso tomba na Rota 60 perto de March Ridge.' },
  { source: 'Knox Knews · 5 jul 1993',           text: 'CHEIRO FÉTIDO PODE SER "PROCESSO NATURAL". Professora de geografia liga odor misterioso ao Rio Ohio.' },
];

function fmtDateLong(dateStr: string): string {
  return formatDate(`${dateStr}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function autoHeadline(s: NewsStats, t: TFunction): string {
  if (s.deaths_today > 0 && s.kills_today > 0) {
    return t('home.news.headline_deaths_and_kills', { count: s.deaths_today, deaths: s.deaths_today, kills: formatNumber(s.kills_today) });
  }
  if (s.deaths_today > 0) {
    return t('home.news.headline_deaths_only', { count: s.deaths_today, deaths: s.deaths_today, alive: formatNumber(s.alive_count) });
  }
  if (s.kills_today > 0) {
    return t('home.news.headline_kills_only', { kills: formatNumber(s.kills_today), alive: formatNumber(s.alive_count) });
  }
  if (s.syncs_today > 0) {
    return t('home.news.headline_syncs_only', { count: s.syncs_today });
  }
  return t('home.news.headline_default', { count: s.alive_count, alive: formatNumber(s.alive_count) });
}

interface ModalProps {
  news:    DailyNews | null;
  loading: boolean;
  onClose: () => void;
}

function NewsModal({ news, loading, onClose }: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const stats    = news?.stats ?? null;
  const headline = news?.headline ?? (stats ? autoHeadline(stats, t) : null);
  const hasActivity = stats && (stats.deaths_today > 0 || stats.syncs_today > 0 || stats.kills_today > 0);

  return (
    <div className="modal-overlay active" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box news-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" aria-label={t('home.news.close')} onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        {/* Masthead */}
        <div className="news-modal-masthead">
          <span className="news-modal-label"><i className="ti ti-news" /> {t('home.news.title')}</span>
          {news && <span className="news-modal-date">{fmtDateLong(news.date)}</span>}
        </div>

        {loading && (
          <div className="news-modal-state">
            <i className="ti ti-loader-2 spin" /> {t('home.news.loading')}
          </div>
        )}

        {!loading && !news && (
          <div className="news-modal-state news-modal-state--error">
            <i className="ti ti-alert-circle" /> {t('home.news.load_error')}
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
                <span className="news-modal-section-label">{t('home.news.today_happened')}</span>
                <div className="news-today-grid">
                  {stats!.kills_today > 0 && (
                    <div className="news-today-cell news-today-cell--kills">
                      <i className="ti ti-sword" />
                      <span className="news-today-val">+{formatNumber(stats!.kills_today)}</span>
                      <span className="news-today-lbl">{t('home.news.eliminations')}</span>
                    </div>
                  )}
                  {stats!.deaths_today > 0 && (
                    <div className="news-today-cell news-today-cell--deaths">
                      <i className="ti ti-skull" />
                      <span className="news-today-val">{stats!.deaths_today}</span>
                      <span className="news-today-lbl">{t('home.news.deaths', { count: stats!.deaths_today })}</span>
                    </div>
                  )}
                  {stats!.syncs_today > 0 && (
                    <div className="news-today-cell news-today-cell--syncs">
                      <i className="ti ti-users" />
                      <span className="news-today-val">{stats!.syncs_today}</span>
                      <span className="news-today-lbl">{t('home.news.actives', { count: stats!.syncs_today })}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="news-modal-section">
                <span className="news-modal-section-label">{t('home.news.today_happened')}</span>
                <p className="news-quiet">{t('home.news.no_activity')}</p>
              </div>
            )}

            {/* Situação atual */}
            {stats && (
              <div className="news-modal-section">
                <span className="news-modal-section-label">{t('home.news.current_situation')}</span>
                <div className="news-current-row">
                  <span className="news-current-item news-current--alive">
                    <i className="ti ti-heartbeat" />
                    <strong>{formatNumber(stats.alive_count)}</strong> {t('home.stats.alive')}
                  </span>
                  <span className="news-current-sep" />
                  <span className="news-current-item news-current--dead">
                    <i className="ti ti-skull" />
                    <strong>{formatNumber(stats.dead_count)}</strong> {t('home.stats.dead')}
                  </span>
                  <span className="news-current-sep" />
                  <span className="news-current-item news-current--kills">
                    <i className="ti ti-sword" />
                    <strong>{formatNumber(stats.total_kills)}</strong> {t('home.news.total_eliminated')}
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

export function NewsInline() {
  const { t } = useTranslation();
  const [news,    setNews]    = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);

  const initIdx = (() => {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime();
    return Math.floor((Date.now() - start) / 86_400_000) % LORE_HEADLINES.length;
  })();
  const [loreIdx, setLoreIdx] = useState(initIdx);

  const [loreRef, loreApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 60_000, stopOnInteraction: false })]
  );

  useEffect(() => {
    apiGetLatestNews().then(setNews).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loreApi) return;
    if (initIdx > 0) loreApi.scrollTo(initIdx, false);
    loreApi.on('select', () => setLoreIdx(loreApi.selectedScrollSnap()));
  }, [loreApi]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="news-inline news-inline--loading">
      <i className="ti ti-loader-2 spin" />
      <span>{t('home.news.loading')}</span>
    </div>
  );

  if (!news) return null;

  const stats       = news.stats ?? null;
  const headline    = news.headline ?? (stats ? autoHeadline(stats, t) : null);
  const hasActivity = stats && (stats.deaths_today > 0 || stats.syncs_today > 0 || stats.kills_today > 0);

  return (
    <article className="news-inline">

      {/* ── Masthead ── */}
      <header className="news-inline-head">
        <span className="news-inline-label">
          <i className="ti ti-news" /> {t('home.news.title')}
        </span>
        <time className="news-inline-date">{fmtDateLong(news.date)}</time>
      </header>

      {/* ── Vídeo de introdução ── */}
      <div className="news-video-row">
        <iframe
          src="https://www.youtube.com/embed/PLczjbLOmMg?rel=0&modestbranding=1"
          title={t('home.news.intro_video_title')}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* ── Corpo em duas colunas ── */}
      <div className="news-body-grid">

        {/* Coluna esquerda — notícia do dia */}
        <div className="news-col-main">
          {headline && (
            <p className="news-headline-main">{headline}</p>
          )}

          {stats && (
            <div className="news-stats-row">
              {hasActivity && (
                <div className="news-pills">
                  {stats.kills_today > 0 && (
                    <span className="news-pill news-pill--kills">
                      <i className="ti ti-sword" /> +{formatNumber(stats.kills_today)} {t('home.news.eliminated_suffix')}
                    </span>
                  )}
                  {stats.deaths_today > 0 && (
                    <span className="news-pill news-pill--deaths">
                      <i className="ti ti-skull" /> {stats.deaths_today} {t('home.news.deaths', { count: stats.deaths_today })}
                    </span>
                  )}
                  {stats.syncs_today > 0 && (
                    <span className="news-pill news-pill--syncs">
                      <i className="ti ti-users" /> {stats.syncs_today} {t('home.news.actives', { count: stats.syncs_today })}
                    </span>
                  )}
                </div>
              )}
              <div className="news-alive-row">
                <span className="news-alive-item news-alive-item--alive">
                  <i className="ti ti-heartbeat" />
                  <strong>{formatNumber(stats.alive_count)}</strong>
                  <span>{t('home.stats.alive')}</span>
                </span>
                <span className="news-alive-sep" />
                <span className="news-alive-item news-alive-item--dead">
                  <i className="ti ti-skull" />
                  <strong>{formatNumber(stats.dead_count)}</strong>
                  <span>{t('home.stats.dead')}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita — arquivo histórico */}
        <aside className="news-col-lore">
          <div className="news-lore-header">
            <span className="news-lore-label">
              <i className="ti ti-archive" /> {t('home.news.archive')}
            </span>
            <div className="news-lore-controls">
              <button className="lore-nav-btn" onClick={() => loreApi?.scrollPrev()} aria-label={t('home.news.previous')}>
                <i className="ti ti-chevron-left" />
              </button>
              <span className="lore-nav-counter">{loreIdx + 1}/{LORE_HEADLINES.length}</span>
              <button className="lore-nav-btn" onClick={() => loreApi?.scrollNext()} aria-label={t('home.news.next')}>
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
          <div className="embla lore-embla" ref={loreRef}>
            <div className="embla__container">
              {LORE_HEADLINES.map((lore, i) => (
                <div key={i} className="embla__slide news-lore-slide">
                  <span className="news-lore-origin">{lore.source}</span>
                  <p className="news-lore-text">{lore.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </article>
  );
}

export function NewsButton() {
  const { t } = useTranslation();
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
        {t('home.news.title')}
        <i className="ti ti-chevron-right news-trigger-arrow" />
      </button>
      {open && (
        <NewsModal news={news} loading={loading} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
