import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  LanguageCode,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  TranslationDictionary,
} from './index';

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  languages: LanguageMeta[];
  currentLanguageMeta: LanguageMeta;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'ltm_selected_language';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    return 'ru';
  });

  const setLang = (newLang: LanguageCode) => {
    if (TRANSLATIONS[newLang]) {
      setLangState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  };

  useEffect(() => {
    // Keep html lang attribute in sync for accessibility
    document.documentElement.lang = lang;
  }, [lang]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ru;
  const currentLanguageMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageMeta,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
