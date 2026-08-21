import { createContext, useContext, useState, useCallback } from 'react';
import en from './translations/en.json';
import zh from './translations/zh.json';

const translations = { en, zh };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return sessionStorage.getItem('pms-lang') || 'en'; } catch { return 'en'; }
  });

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    try { sessionStorage.setItem('pms-lang', lang); } catch { /* noop */ }
  }, []);

  const t = useCallback((key, params) => {
    const dict = translations[language] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

export function useLanguage() {
  const { language, setLanguage } = useContext(LanguageContext);
  return { language, setLanguage };
}
