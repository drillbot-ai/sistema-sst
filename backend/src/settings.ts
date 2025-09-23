import fs from 'fs';
import path from 'path';

export type ThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  fontFamily: string;
  baseFontSize: string; // e.g., '14px'
  borderRadius: string; // e.g., '0.5rem'
};

const dataDir = path.join(__dirname, '..', '..', 'data');
const themeFile = path.join(dataDir, 'theme.json');

export const defaultTheme: ThemeSettings = {
  primaryColor: '#2563eb',
  secondaryColor: '#0ea5e9',
  accentColor: '#22c55e',
  backgroundColor: '#ffffff',
  foregroundColor: '#111827',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  baseFontSize: '14px',
  borderRadius: '0.5rem',
};

export function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadTheme(): ThemeSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(themeFile)) {
      const raw = fs.readFileSync(themeFile, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultTheme, ...parsed } as ThemeSettings;
    }
  } catch (e) {
    console.warn('Failed to load theme settings, using defaults', e);
  }
  return { ...defaultTheme };
}

export function saveTheme(theme: Partial<ThemeSettings>): ThemeSettings {
  const current = loadTheme();
  const merged = { ...current, ...theme } as ThemeSettings;
  ensureDataDir();
  fs.writeFileSync(themeFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}
