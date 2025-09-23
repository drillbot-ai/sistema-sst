"use client";

import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemePalette = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  borderColor?: string;
  panelColor?: string;
  linkColor?: string;
  mutedBgColor?: string;
  mutedTextColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
};

type ThemeSettings = ThemePalette & {
  fontFamily: string;
  baseFontSize: string;
  borderRadius: string;
};

type ThemeBundle = {
  mode: 'light' | 'dark';
  light: ThemeSettings;
  dark: ThemeSettings;
  presets?: Record<string, ThemeBundle>;
};

type ThemeContextType = {
  theme: ThemeSettings;
  mode: 'light' | 'dark';
  setTheme: (t: Partial<ThemeSettings>) => Promise<void>;
  setMode: (m: 'light' | 'dark') => Promise<void>;
  bundle: ThemeBundle | null;
  isLoading: boolean;
};

const defaultTheme: ThemeSettings = {
  primaryColor: '#2563eb',
  secondaryColor: '#0ea5e9',
  accentColor: '#22c55e',
  backgroundColor: '#ffffff',
  foregroundColor: '#111827',
  borderColor: '#e5e7eb',
  panelColor: '#ffffff',
  linkColor: '#2563eb',
  mutedBgColor: '#f9fafb',
  mutedTextColor: '#6b7280',
  successColor: '#16a34a',
  warningColor: '#f59e0b',
  errorColor: '#dc2626',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  baseFontSize: '14px',
  borderRadius: '0.5rem',
};

const ThemeContext = createContext<ThemeContextType>({ theme: defaultTheme, mode: 'light', setTheme: async () => {}, setMode: async () => {}, isLoading: true, bundle: null });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<ThemeBundle | null>(null);
  const [theme, setThemeState] = useState<ThemeSettings>(defaultTheme);
  const [mode, setModeState] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Apply CSS variables to document root
  const applyTheme = (t: ThemeSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', t.primaryColor);
    root.style.setProperty('--color-secondary', t.secondaryColor);
    root.style.setProperty('--color-accent', t.accentColor);
    root.style.setProperty('--color-bg', t.backgroundColor);
    root.style.setProperty('--color-fg', t.foregroundColor);
    if (t.borderColor) root.style.setProperty('--color-border', t.borderColor);
    if (t.panelColor) root.style.setProperty('--color-panel', t.panelColor);
    if (t.linkColor) root.style.setProperty('--color-link', t.linkColor);
    if (t.mutedBgColor) root.style.setProperty('--color-muted-bg', t.mutedBgColor);
    if (t.mutedTextColor) root.style.setProperty('--color-muted-text', t.mutedTextColor);
    if (t.successColor) root.style.setProperty('--color-success', t.successColor);
    if (t.warningColor) root.style.setProperty('--color-warning', t.warningColor);
    if (t.errorColor) root.style.setProperty('--color-error', t.errorColor);
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
  const b: ThemeBundle = res.data?.mode ? res.data : { mode: 'light', light: res.data, dark: res.data };
  setBundle(b);
  setModeState(b.mode || 'light');
  const pal = (b.mode === 'dark' ? b.dark : b.light) || defaultTheme;
  setThemeState(pal);
  applyTheme(pal);
      } catch {
        applyTheme(theme);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = async (partial: Partial<ThemeSettings>) => {
    const current = bundle ?? { mode, light: theme, dark: theme } as ThemeBundle;
    const updated = {
      ...current,
      [mode]: { ...theme, ...partial },
    } as ThemeBundle;
    setBundle(updated);
    const pal = updated[mode];
    setThemeState(pal);
    applyTheme(pal);
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  const setMode = async (m: 'light' | 'dark') => {
    const current = bundle ?? { mode, light: theme, dark: theme } as ThemeBundle;
    const updated = { ...current, mode: m } as ThemeBundle;
    setModeState(m);
    setBundle(updated);
    const pal = updated[m];
    setThemeState(pal);
    applyTheme(pal);
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  const value = useMemo(() => ({ theme, mode, setTheme, setMode, isLoading, bundle }), [theme, mode, isLoading, bundle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
