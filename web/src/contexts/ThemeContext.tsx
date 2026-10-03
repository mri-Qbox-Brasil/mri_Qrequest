/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Theme {
  // Cores funcionais por tipo de chamado (o chrome usa tokens do ui-kit).
  accent?: string;
  progress_color?: string;
  tag_bg?: string;
  tag_fg?: string;
  code_bg?: string;
  code_fg?: string;
}

export interface ThemeContextProps {
  themes: Record<string, Theme | undefined>;
  themeType: string;
  setThemeType: (type: string) => void;
  updateTheme: (type: string, theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<string>("default");
  const [themes, setThemes] = useState<Record<string, Theme | undefined>>({
    default: { accent: "#10b981", progress_color: "#10b981" },
    ambulancia: { accent: "#ef4444", progress_color: "#ef4444" },
    police: { accent: "#3b82f6", progress_color: "#3b82f6" },
    bombeiro: { accent: "#f59e0b", progress_color: "#f59e0b" },
    recrutamento: { accent: "#a855f7", progress_color: "#a855f7" },
  });

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const d = ev.data;
      if (d.action === "init" && d.themes) {
        setThemes((prev) => ({ ...prev, ...d.themes }));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const updateTheme = (type: string, theme: Theme) => {
    setThemes((prev) => ({ ...prev, [type]: theme }));
  };

  return (
    <ThemeContext.Provider value={{ themes, themeType, setThemeType, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
