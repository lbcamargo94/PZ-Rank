import { useEffect, useState } from 'react';
import { apiGetLatestNews } from '../lib/api';
import type { DailyNews, NewsStats } from '../types';

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

function getLoreHeadline(): { source: string; text: string } {
  const start = new Date(new Date().getFullYear(), 0, 1).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return LORE_HEADLINES[dayOfYear % LORE_HEADLINES.length];
}

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

export function NewsInline() {
  const [news,    setNews]    = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const lore = getLoreHeadline();

  useEffect(() => {
    apiGetLatestNews()
      .then(setNews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="news-inline news-inline--loading">
      <i className="ti ti-loader-2 spin" />
      <span>Carregando edição de hoje...</span>
    </div>
  );

  if (!news) return null;

  const stats    = news.stats ?? null;
  const headline = news.headline ?? (stats ? autoHeadline(stats) : null);
  const hasActivity = stats && (stats.deaths_today > 0 || stats.syncs_today > 0 || stats.kills_today > 0);

  return (
    <div className="news-inline">
      <div className="news-inline-head">
        <span className="news-inline-label">
          <i className="ti ti-news" /> Jornal do Apocalipse
        </span>
        <span className="news-inline-date">{fmtDateLong(news.date)}</span>
      </div>

      {headline && (
        <p className="news-inline-headline">{headline}</p>
      )}

      {(hasActivity || stats) && (
        <div className="news-inline-footer">
          {hasActivity && (
            <div className="news-inline-stats">
              {stats!.kills_today > 0 && (
                <span className="news-inline-stat news-inline-stat--kills">
                  <i className="ti ti-sword" /> +{fmt(stats!.kills_today)} eliminações
                </span>
              )}
              {stats!.deaths_today > 0 && (
                <span className="news-inline-stat news-inline-stat--deaths">
                  <i className="ti ti-skull" /> {stats!.deaths_today} {stats!.deaths_today === 1 ? 'morte' : 'mortes'}
                </span>
              )}
              {stats!.syncs_today > 0 && (
                <span className="news-inline-stat news-inline-stat--syncs">
                  <i className="ti ti-users" /> {stats!.syncs_today} {stats!.syncs_today === 1 ? 'ativo' : 'ativos'}
                </span>
              )}
            </div>
          )}
          {stats && (
            <div className="news-inline-current">
              <span className="news-inline-cur--alive">
                <i className="ti ti-heartbeat" /> <strong>{fmt(stats.alive_count)}</strong> vivos
              </span>
              <span className="news-inline-sep" />
              <span className="news-inline-cur--dead">
                <i className="ti ti-skull" /> <strong>{fmt(stats.dead_count)}</strong> mortos
              </span>
            </div>
          )}
        </div>
      )}

      <div className="news-inline-lore">
        <span className="news-inline-lore-source">
          <i className="ti ti-archive" /> {lore.source}
        </span>
        <p className="news-inline-lore-text">{lore.text}</p>
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
