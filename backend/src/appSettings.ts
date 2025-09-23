import fs from 'fs';
import path from 'path';

export type LocalizationSettings = {
  language: string; // es-CO, en-US
  timezone: string; // America/Bogota
  dateFormat: string; // DD/MM/YYYY
  timeFormat: '12h' | '24h';
  currency: string; // COP, USD
  numberFormat: 'es-CO' | 'en-US' | string;
};

export type NumberingSequence = {
  key: string; // e.g., VEHICLE, ORDER
  prefix?: string; // e.g., VEH-
  padding?: number; // e.g., 5
  current: number; // last used number (next = current+1)
  suffix?: string;
  enabled?: boolean;
};

export type NumberingSettings = {
  sequences: NumberingSequence[];
};

export type SecuritySettings = {
  passwordMinLength: number;
  passwordRequireNumber: boolean;
  passwordRequireUpper: boolean;
  passwordRequireSymbol: boolean;
  sessionIdleMinutes: number;
  twoFactorEnabled: boolean;
  allowSelfRegistration: boolean;
};

export type NotificationsSettings = {
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smsEnabled: boolean;
  smsProvider?: 'twilio' | 'other' | '';
  smsFrom?: string;
};

export type IntegrationsSettings = {
  s3Enabled: boolean;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  appsmithEnabled?: boolean;
  appsmithEditorUrl?: string; // full URL to your Appsmith app editor page
};

export type AuditSettings = {
  auditEnabled: boolean;
  retentionDays: number;
};

export type TemplatesSettings = {
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
};

export type AutomationSettings = {
  jobsEnabled: boolean;
  dailySummary: boolean;
  weeklyCleanup: boolean;
};

export type AdvancedSettings = {
  enableExperimental: boolean;
  allowUnsafeEval: boolean;
};

export type AppSettings = {
  localization: LocalizationSettings;
  numbering: NumberingSettings;
  security: SecuritySettings;
  notifications: NotificationsSettings;
  integrations: IntegrationsSettings;
  audit: AuditSettings;
  templates: TemplatesSettings;
  automation: AutomationSettings;
  advanced: AdvancedSettings;
};

const dataDir = path.join(__dirname, '..', '..', 'data');
const appSettingsFile = path.join(dataDir, 'appSettings.json');

export const defaultAppSettings: AppSettings = {
  localization: {
    language: 'es-CO',
    timezone: 'America/Bogota',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'COP',
    numberFormat: 'es-CO',
  },
  numbering: {
    sequences: [
      { key: 'VEHICLE', prefix: 'VH-', padding: 5, current: 0, enabled: true },
      { key: 'ORDER', prefix: 'OC-', padding: 6, current: 0, enabled: true },
    ],
  },
  security: {
    passwordMinLength: 8,
    passwordRequireNumber: true,
    passwordRequireUpper: true,
    passwordRequireSymbol: false,
    sessionIdleMinutes: 30,
    twoFactorEnabled: false,
    allowSelfRegistration: false,
  },
  notifications: {
    emailEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smsEnabled: false,
    smsProvider: '',
    smsFrom: '',
  },
  integrations: {
    s3Enabled: false,
    s3Bucket: '',
    s3Region: '',
    s3Endpoint: '',
    s3AccessKey: '',
    s3SecretKey: '',
    appsmithEnabled: false,
    appsmithEditorUrl: '',
  },
  audit: {
    auditEnabled: true,
    retentionDays: 90,
  },
  templates: {
    headerText: '',
    footerText: '',
    logoUrl: '',
  },
  automation: {
    jobsEnabled: false,
    dailySummary: false,
    weeklyCleanup: false,
  },
  advanced: {
    enableExperimental: false,
    allowUnsafeEval: false,
  },
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function loadAppSettings(): AppSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(appSettingsFile)) {
      const raw = fs.readFileSync(appSettingsFile, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      // Deep merge per section to ensure new keys are available
      return {
        ...defaultAppSettings,
        ...parsed,
        localization: { ...defaultAppSettings.localization, ...(parsed.localization || {}) },
        numbering: { ...defaultAppSettings.numbering, ...(parsed.numbering || {}) },
        security: { ...defaultAppSettings.security, ...(parsed.security || {}) },
        notifications: { ...defaultAppSettings.notifications, ...(parsed.notifications || {}) },
        integrations: { ...defaultAppSettings.integrations, ...(parsed.integrations || {}) },
        audit: { ...defaultAppSettings.audit, ...(parsed.audit || {}) },
        templates: { ...defaultAppSettings.templates, ...(parsed.templates || {}) },
        automation: { ...defaultAppSettings.automation, ...(parsed.automation || {}) },
        advanced: { ...defaultAppSettings.advanced, ...(parsed.advanced || {}) },
      } as AppSettings;
    }
  } catch {}
  return { ...defaultAppSettings };
}

export function saveAppSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadAppSettings();
  const merged: AppSettings = {
    ...current,
    ...partial,
    localization: { ...current.localization, ...(partial.localization || {}) },
    numbering: { ...current.numbering, ...(partial.numbering || {}) },
    security: { ...current.security, ...(partial.security || {}) },
    notifications: { ...current.notifications, ...(partial.notifications || {}) },
    integrations: { ...current.integrations, ...(partial.integrations || {}) },
    audit: { ...current.audit, ...(partial.audit || {}) },
    templates: { ...current.templates, ...(partial.templates || {}) },
    automation: { ...current.automation, ...(partial.automation || {}) },
    advanced: { ...current.advanced, ...(partial.advanced || {}) },
  };
  ensureDataDir();
  fs.writeFileSync(appSettingsFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function saveAppSettingsSection<K extends keyof AppSettings>(section: K, value: Partial<AppSettings[K]>): AppSettings {
  const current = loadAppSettings();
  const updated: AppSettings = { ...current, [section]: { ...(current[section] as any), ...(value as any) } } as AppSettings;
  ensureDataDir();
  fs.writeFileSync(appSettingsFile, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
