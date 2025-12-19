import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Theme {
  card_bg?: string;
  title_bg?: string;
  text?: string;
  muted?: string;
  tag_bg?: string;
  tag_fg?: string;
  code_bg?: string;
  code_fg?: string;
  progress_bg?: string;
  progress_color?: string;
  accent?: string;
  card_width?: string;
  card_gap?: string;
  bg_image?: string;
  bg_size?: string;
  bg_position?: string;
}

export interface ThemeContextValue {
  themes: Record<string, Theme>;
  currentTheme: Theme;
  setThemeType: (type: string) => void;
  applyTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Temas padrão caso não sejam definidos na config Lua
const defaultThemes: Record<string, Theme> = {
  default: {
    card_bg: 'rgba(37, 105, 173, 0.78)',
    title_bg: 'rgba(0,0,0,0.55)',
    text: '#F4F7F8',
    muted: '#AAB7B9',
    tag_bg: 'rgba(34,197,94,0.14)',
    tag_fg: '#042712',
    code_bg: 'rgba(255,255,255,0.03)',
    code_fg: '#E6F0EF',
    progress_bg: 'rgba(255,255,255,0.04)',
    progress_color: '#16A34A',
    accent: '#22C55E',
    card_width: '360px',
    card_gap: '12px',
  },
  ambulancia: {
    card_bg: 'rgba(25,8,8,0.85)',
    title_bg: 'rgba(20,5,5,0.65)',
    text: '#F4F7F8',
    muted: '#AAB7B9',
    tag_bg: 'rgba(239,68,68,0.2)',
    tag_fg: '#7f1d1d',
    code_bg: 'rgba(239,68,68,0.15)',
    code_fg: '#fecaca',
    progress_bg: 'rgba(255,255,255,0.04)',
    progress_color: '#dc2626',
    accent: '#ef4444',
    card_width: '360px',
    card_gap: '12px',
  },
  police: {
    card_bg: 'rgba(8,15,30,0.85)',
    title_bg: 'rgba(5,10,20,0.65)',
    text: '#F4F7F8',
    muted: '#AAB7B9',
    tag_bg: 'rgba(59,130,246,0.2)',
    tag_fg: '#1e3a8a',
    code_bg: 'rgba(59,130,246,0.15)',
    code_fg: '#bfdbfe',
    progress_bg: 'rgba(255,255,255,0.04)',
    progress_color: '#2563eb',
    accent: '#3b82f6',
    card_width: '360px',
    card_gap: '12px',
  },
  recrutamento: {
    card_bg: 'rgba(18,8,25,0.85)',
    title_bg: 'rgba(12,5,18,0.65)',
    text: '#F4F7F8',
    muted: '#AAB7B9',
    tag_bg: 'rgba(168,85,247,0.2)',
    tag_fg: '#4c1d95',
    code_bg: 'rgba(168,85,247,0.15)',
    code_fg: '#e9d5ff',
    progress_bg: 'rgba(255,255,255,0.04)',
    progress_color: '#9333ea',
    accent: '#a855f7',
    card_width: '360px',
    card_gap: '12px',
  },
  bombeiro: {
    card_bg: 'rgba(25,12,6,0.85)',
    title_bg: 'rgba(20,8,4,0.65)',
    text: '#F4F7F8',
    muted: '#AAB7B9',
    tag_bg: 'rgba(249,115,22,0.2)',
    tag_fg: '#7c2d12',
    code_bg: 'rgba(249,115,22,0.15)',
    code_fg: '#fed7aa',
    progress_bg: 'rgba(255,255,255,0.04)',
    progress_color: '#ea580c',
    accent: '#f97316',
    card_width: '360px',
    card_gap: '12px',
  },
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themes, setThemes] = useState<Record<string, Theme>>(defaultThemes);
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultThemes.default);

  const applyTheme = (theme: Theme) => {
    const map: Record<string, string> = {
      card_bg: '--card-bg',
      title_bg: '--title-bg',
      tag_bg: '--tag-bg',
      tag_fg: '--tag-fg',
      code_bg: '--code-bg',
      code_fg: '--code-fg',
      text: '--text',
      muted: '--muted',
      progress_bg: '--progress-bg',
      progress_color: '--progress-color',
      accent: '--accent',
      bg_image: '--bg-image',
      bg_size: '--bg-size',
      bg_position: '--bg-position',
      card_width: '--card-width',
      card_gap: '--card-gap',
    };

    for (const [k, v] of Object.entries(map)) {
      const value = theme[k as keyof Theme];
      if (value !== undefined && document && document.documentElement) {
        if (k === 'bg_image') {
          const url = String(value);
          const cssVal = url ? `url('${url.replace(/'/g, "\\'")}')` : 'none';
          document.documentElement.style.setProperty(v, cssVal);
        } else {
          document.documentElement.style.setProperty(v, String(value));
        }
      }
    }

    setCurrentTheme(theme);
  };

  const setThemeType = (type: string) => {
    const theme = themes[type] || themes.default;
    applyTheme(theme);
  };

  useEffect(() => {
    // Listener para receber temas da config Lua
    const handler = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || !d.action) return;
      
      if (d.action === 'init' && d.themes) {
        console.log('[ThemeContext] Temas recebidos do servidor:', d.themes);
        const mergedThemes = { ...defaultThemes, ...d.themes };
        console.log('[ThemeContext] Temas após merge:', Object.keys(mergedThemes));
        setThemes(mergedThemes);
        
        // Aplica o tema default após receber os temas da config
        applyTheme(mergedThemes.default || defaultThemes.default);
      }
    };

    window.addEventListener('message', handler as EventListener);
    return () => window.removeEventListener('message', handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ themes, currentTheme, setThemeType, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

