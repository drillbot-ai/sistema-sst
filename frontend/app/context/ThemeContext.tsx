"use client";

import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  fontFamily: string;
  baseFontSize: string;
  borderRadius: string;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Partial<Theme>) => Promise<void>;
  isLoading: boolean;
};

const defaultTheme: Theme = {
  primaryColor: '#2563eb',
  secondaryColor: '#0ea5e9',
  accentColor: '#22c55e',
  backgroundColor: '#ffffff',
  foregroundColor: '#111827',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  baseFontSize: '14px',
  borderRadius: '0.5rem',
};

const ThemeContext = createContext<ThemeContextType>({ theme: defaultTheme, setTheme: async () => {}, isLoading: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Apply CSS variables to document root
  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', t.primaryColor);
    root.style.setProperty('--color-secondary', t.secondaryColor);
    root.style.setProperty('--color-accent', t.accentColor);
    root.style.setProperty('--color-bg', t.backgroundColor);
    root.style.setProperty('--color-fg', t.foregroundColor);
    root.style.setProperty('--font-family', t.fontFamily);
    root.style.setProperty('--font-size-base', t.baseFontSize);
    root.style.setProperty('--radius-base', t.borderRadius);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('http://localhost:3002/api/settings/theme');
        if (!mounted) return;
        setThemeState(res.data);
        applyTheme(res.data);
      } catch {
        applyTheme(theme);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = async (partial: Partial<Theme>) => {
    const next = { ...theme, ...partial };
    setThemeState(next);
    applyTheme(next);
    // Persist to backend
    await axios.put('http://localhost:3002/api/settings/theme', next);
  };

  const value = useMemo(() => ({ theme, setTheme, isLoading }), [theme, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
