import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, getDeviceLocale, defaultLocale } from './config';
import enTranslations from '../locales/en/common.json';
import csTranslations from '../locales/cs/common.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations: Record<SupportedLocale, any> = {
  en: enTranslations,
  cs: csTranslations,
};

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'user_locale';

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale as SupportedLocale);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocale();
  }, []);

  const loadLocale = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'cs')) {
        setLocaleState(savedLocale as SupportedLocale);
      } else {
        const deviceLocale = getDeviceLocale();
        setLocaleState(deviceLocale as SupportedLocale);
      }
    } catch (error) {
      console.error('Error loading locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLocale = async (newLocale: SupportedLocale) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  if (isLoading) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};
