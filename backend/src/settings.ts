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
  lineHeight?: string; // e.g., '1.5'
  letterSpacing?: string; // e.g., '0px' | '0.5px'
};

export type ThemeSettings = ThemeBase & ThemePalette;

export type ThemeBundle = {
  mode: 'light' | 'dark';
  light: ThemeSettings;
  dark: ThemeSettings;
  presets?: Record<string, ThemeBundlePreset>;
  components?: ThemeComponents;
  fontProvider?: 'system' | 'google';
  googleFont?: string; // e.g., 'Inter' or 'Roboto'
  layout?: ThemeLayout;
};

export type ThemeBundlePreset = ThemeBundle;

export type ThemeComponents = {
  buttonStyle?: 'solid' | 'outline';
  buttonTextCase?: 'normal' | 'uppercase';
  inputBorderWidth?: string; // e.g., '1px'
  focusRingColor?: string; // css color
  tableStriped?: boolean;
  tableStripeColor?: string;
  // Extended controls
  buttonRadius?: string; // e.g., '0.5rem'
  buttonPaddingX?: string; // e.g., '0.75rem'
  buttonPaddingY?: string; // e.g., '0.5rem'
  inputRadius?: string;
  inputPaddingX?: string;
  inputPaddingY?: string;
};

export type ThemeLayout = {
  contentMaxWidth?: string; // e.g., '1200px'
  sidebarWidth?: string; // e.g., '16rem'
  spacingUnit?: string; // e.g., '8px'
  cardShadow?: 'none' | 'sm' | 'md' | 'lg';
};

const dataDir = path.join(__dirname, '..', '..', 'data');
const themeFile = path.join(dataDir, 'theme.json');
const backupsDir = path.join(dataDir, 'backups');

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
  lineHeight: '1.5',
  letterSpacing: '0px',
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
  fontProvider: 'system',
  googleFont: 'Inter',
  components: {
    buttonStyle: 'solid',
    buttonTextCase: 'normal',
    inputBorderWidth: '1px',
    focusRingColor: '#2563eb66',
    tableStriped: true,
    tableStripeColor: '#f5f7fb',
    buttonRadius: '0.5rem',
    buttonPaddingX: '0.75rem',
    buttonPaddingY: '0.5rem',
    inputRadius: '0.5rem',
    inputPaddingX: '0.75rem',
    inputPaddingY: '0.5rem',
  },
  layout: {
    contentMaxWidth: '1200px',
    sidebarWidth: '16rem',
    spacingUnit: '8px',
    cardShadow: 'sm',
  },
  presets: {
    default: {
      mode: 'light',
      light: defaultTheme,
      dark: defaultDark,
      fontProvider: 'system',
      googleFont: 'Inter',
      components: {
        buttonStyle: 'solid',
        buttonTextCase: 'normal',
        inputBorderWidth: '1px',
        focusRingColor: '#2563eb66',
        tableStriped: true,
        tableStripeColor: '#f5f7fb',
        buttonRadius: '0.5rem',
        buttonPaddingX: '0.75rem',
        buttonPaddingY: '0.5rem',
        inputRadius: '0.5rem',
        inputPaddingX: '0.75rem',
        inputPaddingY: '0.5rem',
      },
      layout: {
        contentMaxWidth: '1200px',
        sidebarWidth: '16rem',
        spacingUnit: '8px',
        cardShadow: 'sm',
      },
    },
  },
};

export function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function ensureBackupsDir() {
  ensureDataDir();
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
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

export function listPresets(): string[] {
  const b = loadTheme();
  return Object.keys(b.presets || {});
}

export function savePreset(name: string, preset?: ThemeBundlePreset): ThemeBundle {
  const current = loadTheme();
  const p = preset || current;
  const presets = { ...(current.presets || {}), [name]: p };
  const merged = { ...current, presets };
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function applyPreset(name: string): ThemeBundle | null {
  const current = loadTheme();
  const preset = current.presets?.[name];
  if (!preset) return null;
  const merged = { ...preset, presets: { ...current.presets } };
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function deletePreset(name: string): ThemeBundle {
  const current = loadTheme();
  const presets = { ...(current.presets || {}) };
  delete presets[name];
  const merged = { ...current, presets };
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function resetTheme(): ThemeBundle {
  const base = { ...defaultBundle };
  ensureDataDir();
  fs.writeFileSync(themeFile, JSON.stringify(base, null, 2), 'utf-8');
  return base;
}

export function exportPreset(name: string): ThemeBundlePreset | null {
  const current = loadTheme();
  return current.presets?.[name] ?? null;
}

export function importPreset(name: string, preset: ThemeBundlePreset): ThemeBundle {
  const current = loadTheme();
  const presets = { ...(current.presets || {}), [name]: preset };
  const merged = { ...current, presets };
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function renamePreset(oldName: string, newName: string): ThemeBundle | null {
  const current = loadTheme();
  const presets = { ...(current.presets || {}) };
  const value = presets[oldName];
  if (!value) return null;
  delete presets[oldName];
  presets[newName] = value;
  const merged = { ...current, presets };
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function duplicatePreset(srcName: string, dstName: string): ThemeBundle | null {
  const current = loadTheme();
  const src = current.presets?.[srcName];
  if (!src) return null;
  const presets = { ...(current.presets || {}), [dstName]: { ...src } };
  const merged = { ...current, presets };
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

/**
 * Create a timestamped backup (snapshot) of the current theme bundle on disk.
 * Returns the absolute path to the created backup file.
 */
export function createThemeBackup(): string {
  ensureBackupsDir();
  const ts = new Date()
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+$/, '') // drop milliseconds
    .replace('T', '_');
  const fileName = `theme_${ts}.json`;
  const dest = path.join(backupsDir, fileName);
  const bundle = loadTheme();
  fs.writeFileSync(dest, JSON.stringify(bundle, null, 2), 'utf-8');
  return dest;
}

/** List available theme backup files (filenames only) */
export function listThemeBackups(): string[] {
  try {
    ensureBackupsDir();
    return fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('theme_') && f.endsWith('.json'))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/** Load a specific theme backup file (by filename) */
export function loadThemeBackup(fileName: string): ThemeBundle | null {
  try {
    ensureBackupsDir();
    const full = path.join(backupsDir, fileName);
    if (!full.startsWith(backupsDir)) return null; // basic path traversal guard
    if (!fs.existsSync(full)) return null;
    const raw = fs.readFileSync(full, 'utf-8');
    return JSON.parse(raw) as ThemeBundle;
  } catch {
    return null;
  }
}

/** Restore theme.json from a given backup filename */
export function restoreThemeBackup(fileName: string): ThemeBundle | null {
  const bundle = loadThemeBackup(fileName);
  if (!bundle) return null;
  ensureDataDir();
  fs.writeFileSync(themeFile, JSON.stringify(bundle, null, 2), 'utf-8');
  return bundle;
}
