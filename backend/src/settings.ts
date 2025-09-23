import fs from 'fs';
import path from 'path';

export type ThemePalette = {
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

export type ThemeBase = {
  fontFamily: string;
  baseFontSize: string; // e.g., '14px'
  borderRadius: string; // e.g., '0.5rem'
};

export type ThemeSettings = ThemeBase & ThemePalette;

export type ThemeBundle = {
  mode: 'light' | 'dark';
  light: ThemeSettings;
  dark: ThemeSettings;
  presets?: Record<string, ThemeBundlePreset>;
};

export type ThemeBundlePreset = ThemeBundle;

const dataDir = path.join(__dirname, '..', '..', 'data');
const themeFile = path.join(dataDir, 'theme.json');

export const defaultTheme: ThemeSettings = {
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

export const defaultDark: ThemeSettings = {
  ...defaultTheme,
  backgroundColor: '#0b1220',
  foregroundColor: '#e5e7eb',
  borderColor: '#1f2937',
  panelColor: '#0f172a',
  mutedBgColor: '#111827',
  mutedTextColor: '#9ca3af',
  linkColor: '#60a5fa',
};

export const defaultBundle: ThemeBundle = {
  mode: 'light',
  light: defaultTheme,
  dark: defaultDark,
  presets: {
    default: {
      mode: 'light',
      light: defaultTheme,
      dark: defaultDark,
    },
  },
};

export function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadTheme(): ThemeBundle {
  try {
    ensureDataDir();
    if (fs.existsSync(themeFile)) {
      const raw = fs.readFileSync(themeFile, 'utf-8');
      const parsed = JSON.parse(raw);
      // Backward compatibility: if file contains a flat theme, wrap it as bundle
      if (parsed && parsed.primaryColor) {
        const flat = { ...defaultTheme, ...parsed } as ThemeSettings;
        const bundle: ThemeBundle = { ...defaultBundle, light: flat };
        return bundle;
      }
      return { ...defaultBundle, ...parsed } as ThemeBundle;
    }
  } catch (e) {
    console.warn('Failed to load theme settings, using defaults', e);
  }
  return { ...defaultBundle };
}

export function saveTheme(theme: Partial<ThemeBundle> | Partial<ThemeSettings>): ThemeBundle {
  const current = loadTheme();
  let merged: ThemeBundle;
  // If incoming resembles flat theme, merge into current light
  if ('primaryColor' in (theme as any)) {
    merged = { ...current, light: { ...current.light, ...(theme as Partial<ThemeSettings>) } };
  } else {
    merged = { ...current, ...(theme as Partial<ThemeBundle>) };
  }
  ensureDataDir();
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}
