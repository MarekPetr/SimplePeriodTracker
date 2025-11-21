import { getLocales } from 'expo-localization';

export const defaultLocale = 'en';

export const getDeviceLocale = (): string => {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode || 'en';

  // Support only Czech and English
  return deviceLang === 'cs' ? 'cs' : 'en';
};

export const supportedLocales = ['en', 'cs'] as const;
export type SupportedLocale = typeof supportedLocales[number];
