/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { translations, DEFAULT_LOCALE, Dict } from "./translations";

type I18nContextValue = {
  locale: string;
  setLocale: (loc: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

// Normalize incoming locale codes (e.g. "PT-BR", "pt_BR", "en-US") to our keys.
function normalize(loc?: string): string {
  if (!loc) return DEFAULT_LOCALE;
  const lc = loc.toLowerCase().replace(/_/g, "-");
  if (translations[lc]) return lc;
  // fall back to the base language (e.g. "en-us" -> "en")
  const base = lc.split("-")[0];
  if (translations[base]) return base;
  return DEFAULT_LOCALE;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);

  const setLocale = useCallback((loc: string) => {
    setLocaleState(normalize(loc));
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict: Dict = translations[locale] || translations[DEFAULT_LOCALE];
      return dict[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components never crash if rendered outside the provider.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string) => translations[DEFAULT_LOCALE][key] ?? key,
    };
  }
  return ctx;
}
