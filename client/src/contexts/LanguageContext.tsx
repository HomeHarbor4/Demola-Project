// src/contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import fiTranslations from '../locales/fi.json';
import svTranslations from '../locales/sv.json';

// Define supported languages and their display names
export type SupportedLanguage = 'en' | 'fi' | 'sv';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Load translations from JSON files
const translations: Record<SupportedLanguage, Record<string, any>> = {
  en: enTranslations,
  fi: fiTranslations,
  sv: svTranslations
};

// Default language
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'fi', label: 'Suomi' },
  { value: 'sv', label: 'Svenska' }
];

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const getInitialLanguage = (): SupportedLanguage => {
    const savedLanguage = localStorage.getItem('homeHarborLanguage');
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      return savedLanguage as SupportedLanguage;
    }
    const browserLang = navigator.language.split('-')[0];
    return (Object.keys(translations).includes(browserLang)
      ? browserLang
      : DEFAULT_LANGUAGE) as SupportedLanguage;
  };

  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage());

  // Update document lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Updated Translation function with basic interpolation, pluralization, and nested key support
  const getNestedTranslation = (obj: any, key: string): any => {
    return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  };

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const currentTranslations = translations[language];
    const fallbackTranslations = translations[DEFAULT_LANGUAGE];

    let translationKey = key;
    let translation = '';

    // Basic pluralization check
    if (options && typeof options.count === 'number' && options.count !== 1) {
      const pluralKey = `${key}_plural`;
      if (getNestedTranslation(currentTranslations, pluralKey) || getNestedTranslation(fallbackTranslations, pluralKey)) {
        translationKey = pluralKey;
      }
    }

    // Get translation from current language or fallback (support nested keys)
    translation =
      getNestedTranslation(currentTranslations, translationKey) ||
      getNestedTranslation(fallbackTranslations, translationKey) ||
      key;

    // Basic interpolation: replace {{variable}}
    if (options) {
      Object.keys(options).forEach((optionKey) => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }

    return translation;
  };

  // Save language preference to localStorage
  const setLanguage = (newLanguage: SupportedLanguage) => {
    if (Object.keys(translations).includes(newLanguage)) {
      localStorage.setItem('homeHarborLanguage', newLanguage);
      setLanguageState(newLanguage);
    } else {
      console.warn(`Attempted to set unsupported language: ${newLanguage}`);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
