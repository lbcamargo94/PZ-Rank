import i18n from './i18n';

// Mapa idioma da UI (i18next) → locale do Intl, usado pra formatação de
// número/data. Só usado nos arquivos migrados na fase 1 do i18n — o
// restante do site ainda usa `.toLocaleString('pt-BR')` hardcoded.
const INTL_LOCALE: Record<string, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-419',
  fr: 'fr-FR',
};

function currentLocale(): string {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'pt';
  return INTL_LOCALE[lng] ?? 'pt-BR';
}

export function formatNumber(n: number): string {
  return n.toLocaleString(currentLocale());
}

// Notação compacta (1,5 mi / 1.5M / 1,5 M conforme o idioma) — substitui a
// lógica manual de sufixo "mi"/"mil" que só cobria pt-BR.
export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat(currentLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString(currentLocale(), opts);
}

export function formatDateTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(currentLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' });
}
