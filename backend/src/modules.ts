import fs from 'fs';
import path from 'path';

export type ModuleAction = {
  id: string;               // unique key for the action, used by frontend and backend
  label: string;            // human label
  type: 'navigate' | 'open-modal' | 'run-api' | 'export' | 'custom';
  target?: string;          // route, modalId, api endpoint, export type, etc.
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payloadSchema?: any;      // optional JSON schema for action payload
  permissions?: string[];   // optional permissions/roles required
};

export type ModuleTableColumn = {
  key: string;              // data field key
  label: string;
  width?: number | string;
  sortable?: boolean;
  format?: 'text' | 'number' | 'date' | 'money' | 'badge' | 'link';
};

export type DataSource = {
  url: string;                          // internal API path e.g. /api/vehicles
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: any;                         // query params for GET
  body?: any;                           // body for non-GET
  path?: string;                        // dot-path to array in response (e.g., 'data.items')
  headers?: Record<string, string>;     // optional extra headers
};

export type ModuleTable = {
  id: string;               // table id
  dataKey?: string;         // optional legacy key
  dataSource?: DataSource;  // server/route to fetch rows
  columns: ModuleTableColumn[];
  striped?: boolean;
  pageSize?: number;
};

export type ModuleMetric = {
  id: string;
  label: string;
  valueExpr?: string;       // expression or API to compute value
  unit?: string;
  color?: string;
  dataSource?: DataSource;  // optional API to fetch a numeric value; if provided, runtime will fetch and display
};

export type ModuleFormField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  // Validation rules (optional)
  min?: number;            // for number/date (as timestamp) or length
  max?: number;            // for number/date (as timestamp) or length
  minLength?: number;      // for text/textarea
  maxLength?: number;      // for text/textarea
  pattern?: string;        // regex string for text
  message?: string;        // custom validation message
  placeholder?: string;    // UI hint
  defaultValue?: any;      // initial value
};

export type ModuleForm = {
  id: string;
  title: string;
  submitActionId?: string;  // action to execute on submit
  fields: ModuleFormField[];
};

export type ModuleModal = {
  id: string;
  title: string;
  contentType: 'form' | 'custom';
  formId?: string;          // when contentType=form
};

export type Submodule = {
  id: string;               // unique id
  name: string;
  route?: string;           // e.g., /vehiculos or relative path
  description?: string;
  actions?: ModuleAction[];
  tables?: ModuleTable[];
  metrics?: ModuleMetric[];
  modals?: ModuleModal[];
  forms?: ModuleForm[];
  layout?: Layout;          // optional drag & drop grid layout
};

export type AppModule = {
  id: string;               // unique id, used to map in frontend sidebar and backend permissions
  name: string;
  icon?: string;
  order?: number;
  enabled?: boolean;
  submodules?: Submodule[];
};

export type ModulesConfig = {
  version: number;
  modules: AppModule[];
};

// --- Layout types ---
export type LayoutWidget =
  | { id: string; type: 'metric'; metricId: string }
  | { id: string; type: 'table'; tableId: string }
  | { id: string; type: 'actions'; actionIds?: string[] }
  | { id: string; type: 'form'; formId: string }
  | { id: string; type: 'text'; text: string };

export type LayoutColumn = { id: string; span: number; widgets: LayoutWidget[] };
export type LayoutRow = { id: string; columns: LayoutColumn[] };
export type Layout = { rows: LayoutRow[] };

const dataDir = path.join(__dirname, '..', '..', 'data');
const modulesFile = path.join(dataDir, 'modules.json');
const backupsDir = path.join(dataDir, 'backups');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
}

export function loadModules(): ModulesConfig {
  ensureDataDir();
  if (fs.existsSync(modulesFile)) {
    try {
      const raw = fs.readFileSync(modulesFile, 'utf-8');
      const parsed = JSON.parse(raw) as ModulesConfig;
      if (!parsed.version) parsed.version = 1;
      if (!Array.isArray(parsed.modules)) parsed.modules = [];
      return parsed;
    } catch (e) {
      console.warn('Failed to parse modules.json, resetting to empty', e);
    }
  }
  const empty: ModulesConfig = { version: 1, modules: [] };
  fs.writeFileSync(modulesFile, JSON.stringify(empty, null, 2), 'utf-8');
  return empty;
}

export function saveModules(cfg: ModulesConfig): ModulesConfig {
  ensureDataDir();
  const normalized: ModulesConfig = {
    version: cfg.version || 1,
    modules: Array.isArray(cfg.modules) ? cfg.modules : [],
  };
  fs.writeFileSync(modulesFile, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

export function upsertModule(mod: AppModule): ModulesConfig {
  const cfg = loadModules();
  const idx = cfg.modules.findIndex((m) => m.id === mod.id);
  if (idx >= 0) cfg.modules[idx] = { ...cfg.modules[idx], ...mod };
  else cfg.modules.push(mod);
  return saveModules(cfg);
}

export function deleteModule(id: string): ModulesConfig {
  const cfg = loadModules();
  cfg.modules = cfg.modules.filter((m) => m.id !== id);
  return saveModules(cfg);
}

export function upsertSubmodule(moduleId: string, sub: Submodule): ModulesConfig {
  const cfg = loadModules();
  const mod = cfg.modules.find((m) => m.id === moduleId);
  if (!mod) throw new Error('Module not found');
  const list = mod.submodules || (mod.submodules = []);
  const idx = list.findIndex((s) => s.id === sub.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...sub };
  else list.push(sub);
  return saveModules(cfg);
}

export function deleteSubmodule(moduleId: string, subId: string): ModulesConfig {
  const cfg = loadModules();
  const mod = cfg.modules.find((m) => m.id === moduleId);
  if (!mod) throw new Error('Module not found');
  mod.submodules = (mod.submodules || []).filter((s) => s.id !== subId);
  return saveModules(cfg);
}

// Helpers to upsert specific component types inside a submodule could be added later as needed.

// Backups for modules.json
export function createModulesBackup(): string {
  ensureDataDir();
  ensureBackupsDir();
  const ts = new Date()
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+$/, '')
    .replace('T', '_');
  const fileName = `modules_${ts}.json`;
  const dest = path.join(backupsDir, fileName);
  const data = loadModules();
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
  return dest;
}

export function listModulesBackups(): string[] {
  try {
    ensureBackupsDir();
    return fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('modules_') && f.endsWith('.json'))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function loadModulesBackup(fileName: string): ModulesConfig | null {
  try {
    ensureBackupsDir();
    const full = path.join(backupsDir, fileName);
    if (!full.startsWith(backupsDir)) return null;
    if (!fs.existsSync(full)) return null;
    const raw = fs.readFileSync(full, 'utf-8');
    return JSON.parse(raw) as ModulesConfig;
  } catch {
    return null;
  }
}

export function restoreModulesBackup(fileName: string): ModulesConfig | null {
  const data = loadModulesBackup(fileName);
  if (!data) return null;
  saveModules(data);
  return data;
}
