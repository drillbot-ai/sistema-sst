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
  lineHeight?: string;
  letterSpacing?: string;
};

type ThemeBundle = {
  mode: 'light' | 'dark';
  light: ThemeSettings;
  dark: ThemeSettings;
  presets?: Record<string, ThemeBundle>;
  components?: ThemeComponents;
  fontProvider?: 'system' | 'google';
  googleFont?: string;
  layout?: ThemeLayout;
};

// Minimal component theming for later use
export type ThemeComponents = {
  buttonStyle?: 'solid' | 'outline';
  buttonTextCase?: 'normal' | 'uppercase';
  inputBorderWidth?: string;
  focusRingColor?: string;
  tableStriped?: boolean;
  tableStripeColor?: string;
  buttonRadius?: string;
  buttonPaddingX?: string;
  buttonPaddingY?: string;
  inputRadius?: string;
  inputPaddingX?: string;
  inputPaddingY?: string;
}

export type ThemeLayout = {
  contentMaxWidth?: string;
  sidebarWidth?: string;
  spacingUnit?: string;
  cardShadow?: 'none' | 'sm' | 'md' | 'lg';
}

type ThemeContextType = {
  theme: ThemeSettings;
  mode: 'light' | 'dark';
  setTheme: (t: Partial<ThemeSettings>) => Promise<void>;
  setMode: (m: 'light' | 'dark') => Promise<void>;
  bundle: ThemeBundle | null;
  isLoading: boolean;
  // Presets helpers
  listPresets: () => Promise<string[]>;
  savePreset: (name: string) => Promise<void>;
  applyPreset: (name: string) => Promise<void>;
  deletePreset: (name: string) => Promise<void>;
  resetTheme: () => Promise<void>;
  setFontProvider: (provider: 'system' | 'google', googleFont?: string) => Promise<void>;
  setComponents: (c: Partial<ThemeComponents>) => Promise<void>;
  setLayout: (l: Partial<ThemeLayout>) => Promise<void>;
  renamePreset: (oldName: string, newName: string) => Promise<void>;
  duplicatePreset: (src: string, copyName: string) => Promise<void>;
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

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  mode: 'light',
  setTheme: async () => {},
  setMode: async () => {},
  isLoading: true,
  bundle: null,
  listPresets: async () => [],
  savePreset: async () => {},
  applyPreset: async () => {},
  deletePreset: async () => {},
  resetTheme: async () => {},
  setFontProvider: async () => {},
  setComponents: async () => {},
  setLayout: async () => {},
  renamePreset: async () => {},
  duplicatePreset: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<ThemeBundle | null>(null);
  const [theme, setThemeState] = useState<ThemeSettings>(defaultTheme);
  const [mode, setModeState] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Apply CSS variables to document root
  const applyTheme = (t: ThemeSettings, b?: ThemeBundle | null) => {
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
    if (t.lineHeight) root.style.setProperty('--line-height', t.lineHeight);
    if (t.letterSpacing) root.style.setProperty('--letter-spacing', t.letterSpacing);
    // component-level vars if provided
    if (b?.components?.focusRingColor) root.style.setProperty('--focus-ring', b.components.focusRingColor);
    if (b?.components?.inputBorderWidth) root.style.setProperty('--input-border-w', b.components.inputBorderWidth);
    if (b?.components?.tableStripeColor) root.style.setProperty('--table-stripe', b.components.tableStripeColor);
    if (b?.components?.buttonRadius) root.style.setProperty('--btn-radius', b.components.buttonRadius);
    if (b?.components?.buttonPaddingX) root.style.setProperty('--btn-px', b.components.buttonPaddingX);
    if (b?.components?.buttonPaddingY) root.style.setProperty('--btn-py', b.components.buttonPaddingY);
    if (b?.components?.inputRadius) root.style.setProperty('--input-radius', b.components.inputRadius);
    if (b?.components?.inputPaddingX) root.style.setProperty('--input-px', b.components.inputPaddingX);
    if (b?.components?.inputPaddingY) root.style.setProperty('--input-py', b.components.inputPaddingY);
    // layout vars
    if (b?.layout?.contentMaxWidth) root.style.setProperty('--content-max-w', b.layout.contentMaxWidth);
    if (b?.layout?.sidebarWidth) root.style.setProperty('--sidebar-w', b.layout.sidebarWidth);
    if (b?.layout?.spacingUnit) root.style.setProperty('--space', b.layout.spacingUnit);
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
        applyTheme(pal, b);
        // Google Fonts loader
        if (b.fontProvider === 'google' && b.googleFont) {
          const id = 'theme-google-font';
          if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            const family = encodeURIComponent(b.googleFont + ':wght@400;500;600;700');
            link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
            document.head.appendChild(link);
          }
          // prepend the google font to current font family
          const nameOnly = b.googleFont.split(',')[0];
          const next = `${nameOnly}, ${pal.fontFamily}`;
          document.documentElement.style.setProperty('--font-family', next);
        }
      } catch {
        applyTheme(theme, bundle);
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
    applyTheme(pal, updated);
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  const setMode = async (m: 'light' | 'dark') => {
    const current = bundle ?? { mode, light: theme, dark: theme } as ThemeBundle;
    const updated = { ...current, mode: m } as ThemeBundle;
    setModeState(m);
    setBundle(updated);
    const pal = updated[m];
    setThemeState(pal);
    applyTheme(pal, updated);
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  // Presets helpers
  const listPresets = async (): Promise<string[]> => {
    const res = await axios.get('http://localhost:3002/api/settings/theme/presets');
    return Array.isArray(res.data?.presets) ? res.data.presets : [];
  };
  const savePreset = async (name: string) => {
    const current = bundle ?? { mode, light: theme, dark: theme } as ThemeBundle;
    const res = await axios.post('http://localhost:3002/api/settings/theme/presets', { name, preset: current });
    const b: ThemeBundle = res.data;
    setBundle(b);
    const pal = (b.mode === 'dark' ? b.dark : b.light) || theme;
    setThemeState(pal);
    applyTheme(pal, b);
  };
  const applyPreset = async (name: string) => {
    const res = await axios.post(`http://localhost:3002/api/settings/theme/presets/${encodeURIComponent(name)}/apply`);
    const b: ThemeBundle = res.data;
    setBundle(b);
    setModeState(b.mode || 'light');
    const pal = (b.mode === 'dark' ? b.dark : b.light) || theme;
    setThemeState(pal);
    applyTheme(pal, b);
  };
  const deletePreset = async (name: string) => {
    const res = await axios.delete(`http://localhost:3002/api/settings/theme/presets/${encodeURIComponent(name)}`);
    const b: ThemeBundle = res.data;
    setBundle(b);
    const pal = (b.mode === 'dark' ? b.dark : b.light) || theme;
    setThemeState(pal);
    applyTheme(pal, b);
  };
  const resetTheme = async () => {
    const res = await axios.post('http://localhost:3002/api/settings/theme/reset');
    const b: ThemeBundle = res.data;
    setBundle(b);
    setModeState(b.mode || 'light');
    const pal = (b.mode === 'dark' ? b.dark : b.light) || defaultTheme;
    setThemeState(pal);
    applyTheme(pal, b);
  };

  // Simple helpers to update font provider and google font choice
  const setFontProvider = async (provider: 'system' | 'google', googleFont?: string) => {
    const current = bundle ?? { mode, light: theme, dark: theme } as ThemeBundle;
    const updated: ThemeBundle = { ...current, fontProvider: provider, googleFont: googleFont ?? current.googleFont };
    setBundle(updated);
    const pal = updated[mode];
    setThemeState(pal);
    applyTheme(pal, updated);
    // inject link if needed
    if (provider === 'google' && updated.googleFont) {
      const id = 'theme-google-font';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        const family = encodeURIComponent(updated.googleFont + ':wght@400;500;600;700');
        link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
        document.head.appendChild(link);
      }
      const nameOnly = updated.googleFont.split(',')[0];
      const next = `${nameOnly}, ${pal.fontFamily}`;
      document.documentElement.style.setProperty('--font-family', next);
    }
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  const setComponents = async (c: Partial<ThemeComponents>) => {
    const current = bundle ?? ({ mode, light: theme, dark: theme } as ThemeBundle);
    const updated: ThemeBundle = { ...current, components: { ...(current.components || {}), ...c } };
    setBundle(updated);
    const pal = updated[mode];
    setThemeState(pal);
    applyTheme(pal, updated);
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  const setLayout = async (l: Partial<ThemeLayout>) => {
    const current = bundle ?? ({ mode, light: theme, dark: theme } as ThemeBundle);
    const updated: ThemeBundle = { ...current, layout: { ...(current.layout || {}), ...l } };
    setBundle(updated);
    const pal = updated[mode];
    setThemeState(pal);
    applyTheme(pal, updated);
    await axios.put('http://localhost:3002/api/settings/theme', updated);
  };

  const renamePreset = async (oldName: string, newName: string) => {
    const res = await axios.post(`http://localhost:3002/api/settings/theme/presets/${encodeURIComponent(oldName)}/rename`, { newName });
    const b: ThemeBundle = res.data;
    setBundle(b);
    const pal = (b.mode === 'dark' ? b.dark : b.light) || theme;
    setThemeState(pal);
    applyTheme(pal, b);
  };

  const duplicatePreset = async (src: string, copyName: string) => {
    const res = await axios.post(`http://localhost:3002/api/settings/theme/presets/${encodeURIComponent(src)}/duplicate`, { copyName });
    const b: ThemeBundle = res.data;
    setBundle(b);
    const pal = (b.mode === 'dark' ? b.dark : b.light) || theme;
    setThemeState(pal);
    applyTheme(pal, b);
  };

  // expose in context by extending value
  const value = useMemo(() => ({
    theme,
    mode,
    setTheme,
    setMode,
    isLoading,
    bundle,
    listPresets,
    savePreset,
    applyPreset,
    deletePreset,
    resetTheme,
    setFontProvider,
    setComponents,
    setLayout,
    renamePreset,
    duplicatePreset,
  }), [theme, mode, isLoading, bundle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
