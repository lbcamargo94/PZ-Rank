import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../lib/i18n';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
  fr: 'FR',
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'pt') as SupportedLanguage;

  return (
    <select
      className="language-switcher"
      value={SUPPORTED_LANGUAGES.includes(current) ? current : 'pt'}
      onChange={e => i18n.changeLanguage(e.target.value)}
      aria-label={t('common.language')}
      title={t('common.language')}
    >
      {SUPPORTED_LANGUAGES.map(lng => (
        <option key={lng} value={lng}>{LANGUAGE_LABELS[lng]}</option>
      ))}
    </select>
  );
}
