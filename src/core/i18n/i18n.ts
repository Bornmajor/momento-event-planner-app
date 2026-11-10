import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import sw from '@/locales/sw.json';

export const LANGUAGES = ['en', 'fr', 'sw'] as const;
export type AppLanguage = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<AppLanguage, string> = { en: 'English', fr: 'Français', sw: 'Kiswahili' };

export function isAppLanguage(code: unknown): code is AppLanguage {
  return typeof code === 'string' && (LANGUAGES as readonly string[]).includes(code);
}

/** The phone's language if we support it, otherwise English (spec §8). */
export function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return isAppLanguage(code) ? code : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member -- i18next's documented setup uses the default instance
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, sw: { translation: sw } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export default i18n;
