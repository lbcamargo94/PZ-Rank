import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from '../locales/pt/translation.json';
import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import fr from '../locales/fr/translation.json';

// Fase 1 do i18n: cobre chrome global (Header/Footer) + páginas públicas
// principais (Home, Rank, Perfil, Regras). O restante do site (painel,
// conta, wiki, mods...) ainda não foi migrado e continua fixo em pt-BR
// mesmo com outro idioma selecionado — ver plano da feature.
export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'fr'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: 'pt',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pzrank_lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
