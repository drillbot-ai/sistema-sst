"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ListShell from "../../../components/ListShell";
import { getDefaultSidebarGroups } from "../../../components/sidebarData";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type ModuleAction = {
  id: string;
  label: string;
  type: 'navigate' | 'open-modal' | 'run-api' | 'export' | 'custom';
  target?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payloadSchema?: any;
  permissions?: string[];
};

type ModuleTableColumn = { key: string; label: string; width?: number | string; sortable?: boolean; format?: 'text' | 'number' | 'date' | 'money' | 'badge' | 'link' };
type ModuleTable = { id: string; dataKey?: string; dataSource?: { url: string; method?: 'GET'|'POST'|'PUT'|'DELETE'; path?: string }; columns: ModuleTableColumn[]; striped?: boolean; pageSize?: number };
type ModuleMetric = { id: string; label: string; valueExpr?: string; unit?: string; color?: string; dataSource?: { url: string; method?: 'GET'|'POST'|'PUT'|'DELETE'; path?: string } };
type ModuleFormField = { key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file'; required?: boolean; options?: Array<{ value: string; label: string }>; min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string; message?: string; placeholder?: string; defaultValue?: any };
type ModuleForm = { id: string; title: string; submitActionId?: string; fields: ModuleFormField[] };
type ModuleModal = { id: string; title: string; contentType: 'form' | 'custom'; formId?: string };
// Layout model
type LayoutWidget =
  | { id: string; type: 'metric'; metricId: string }
  | { id: string; type: 'table'; tableId: string }
  | { id: string; type: 'actions'; actionIds?: string[] }
  | { id: string; type: 'form'; formId: string }
  | { id: string; type: 'text'; text: string };
type LayoutColumn = { id: string; span: number; widgets: LayoutWidget[] };
type LayoutRow = { id: string; columns: LayoutColumn[] };
type Layout = { rows: LayoutRow[] };
type Submodule = { id: string; name: string; route?: string; description?: string; actions?: ModuleAction[]; tables?: ModuleTable[]; metrics?: ModuleMetric[]; modals?: ModuleModal[]; forms?: ModuleForm[]; layout?: Layout };
type AppModule = { id: string; name: string; icon?: string; order?: number; enabled?: boolean; submodules?: Submodule[] };
type ModulesConfig = { version: number; modules: AppModule[] };

const apiBase = 'http://localhost:3002/api/settings/modules';

export default function ModulosSettingsPage() {
  const [cfg, setCfg] = useState<ModulesConfig>({ version: 1, modules: [] });
  const [active, setActive] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [rawEditor, setRawEditor] = useState<string>('');
  const [showJson, setShowJson] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'actions'|'tables'|'metrics'|'forms'|'modals'>('tables');
  const [rightTab, setRightTab] = useState<'json'>('json');
  const [mainTab, setMainTab] = useState<'submodulo'|'editores'|'json'>('submodulo');
  const activeModule = useMemo(() => cfg.modules.find(m => m.id === active) || null, [cfg, active]);
  const activeSubmodule = useMemo(() => activeModule?.submodules?.find(s => s.id === activeSub) || null, [activeModule, activeSub]);
  const [appsmithBase, setAppsmithBase] = useState<string | null>(null);
  const [appsmithEnabled, setAppsmithEnabled] = useState<boolean>(false);
  useEffect(() => {
    // Try env/public var first
    const envUrl = (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_APPSMITH_EDITOR_URL) || process.env.NEXT_PUBLIC_APPSMITH_EDITOR_URL;
    if (envUrl) {
      setAppsmithBase(envUrl);
      setAppsmithEnabled(true);
      return;
    }
    // Fallback: load from Integrations settings
    (async () => {
      try {
        const res = await fetch('http://localhost:3002/api/settings/app');
        const data = await res.json();
        const url = data?.integrations?.appsmithEditorUrl as string | undefined;
        const enabled = !!data?.integrations?.appsmithEnabled;
        setAppsmithBase(url || null);
        setAppsmithEnabled(!!enabled && !!url);
      } catch {
        setAppsmithBase(null);
        setAppsmithEnabled(false);
      }
    })();
  }, []);

  const openInAppsmith = (mod?: AppModule | null, sub?: Submodule | null) => {
    if (!appsmithEnabled || !appsmithBase) {
      alert('Appsmith no está configurado. Ve a Ajustes > Integraciones para establecer la URL del editor.');
      return;
    }
    const params = new URLSearchParams();
    if (mod?.id) params.set('moduleId', mod.id);
    if (sub?.id) params.set('submoduleId', sub.id);
    const url = `${appsmithBase}${appsmithBase.includes('?') ? '&' : '?'}${params.toString()}`;
    window.open(url, '_blank', 'noopener');
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiBase);
        const data = await res.json();
        setCfg(data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (activeSubmodule) {
      setRawEditor(JSON.stringify(activeSubmodule, null, 2));
    } else if (activeModule) {
      setRawEditor(JSON.stringify(activeModule, null, 2));
    } else {
      setRawEditor(JSON.stringify(cfg, null, 2));
    }
  }, [cfg, activeModule, activeSubmodule]);

  // Computed modules sorted by 'order' (fallback to tail if undefined)
  const modulesSorted = useMemo(() => {
    const copy = [...cfg.modules];
    copy.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
    return copy;
  }, [cfg.modules]);

  // Reorder a module up/down and persist the new ordering
  const moveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const sorted = [...modulesSorted];
    const idx = sorted.findIndex(m => m.id === moduleId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const [moved] = sorted.splice(idx, 1);
    sorted.splice(targetIdx, 0, moved);
    // Renumber order 1..n
    const renumbered = sorted.map((m, i) => ({ ...m, order: i + 1 }));
    // Build new config mapping updates back to original array
    const newCfg: ModulesConfig = {
      ...cfg,
      modules: cfg.modules.map(m => renumbered.find(x => x.id === m.id) || m),
    };
    try {
      const res = await fetch(`${apiBase}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCfg) });
      const updated = await res.json();
      setCfg(updated);
      window.dispatchEvent(new Event('modules-updated'));
    } catch {}
  };

  const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
  const downloadJson = (name: string, obj: any) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importSubmodule = async (file: File) => {
    try {
      const text = await file.text();
      const sub = JSON.parse(text) as Submodule;
      if (!activeModule || !sub?.id) return alert('Archivo inválido');
      const res = await fetch(`${apiBase}/${activeModule.id}/submodules/${sub.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(sub) });
      setCfg(await res.json());
      setActiveSub(sub.id);
      alert('Submódulo importado');
    } catch { alert('No se pudo importar'); }
  };

  const addModule = async () => {
    const name = prompt('Nombre del módulo');
    if (!name) return;
    const id = genId('mod');
    const body: AppModule = { id, name, enabled: true, order: cfg.modules.length + 1, submodules: [] };
    const res = await fetch(`${apiBase}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const updated = await res.json();
  setCfg(updated);
  window.dispatchEvent(new Event('modules-updated'));
    setActive(id);
    setActiveSub(null);
  };

  const removeModule = async (id: string) => {
    if (!confirm('Eliminar módulo?')) return;
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
  const updated = await res.json();
  setCfg(updated);
  window.dispatchEvent(new Event('modules-updated'));
    setActive(null);
    setActiveSub(null);
  };

  const addSubmodule = async () => {
    if (!activeModule) return;
    const name = prompt('Nombre del submódulo');
    if (!name) return;
    const subId = genId('sub');
    const sub: Submodule = { id: subId, name, route: `/${name.toLowerCase().replace(/\s+/g, '-')}` };
    const res = await fetch(`${apiBase}/${activeModule.id}/submodules/${subId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
  const updated = await res.json();
  setCfg(updated);
  window.dispatchEvent(new Event('modules-updated'));
    // Scaffold page for the new route
    if (sub.route) {
      try { await fetch('/api/scaffold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: sub.route, title: sub.name }) }); } catch {}
    }
    setActiveSub(subId);
    // Open Appsmith editor for the new submodule
    try { openInAppsmith(activeModule, sub); } catch {}
  };

  const removeSubmodule = async (subId: string) => {
    if (!activeModule) return;
    if (!confirm('Eliminar submódulo?')) return;
    const res = await fetch(`${apiBase}/${activeModule.id}/submodules/${subId}`, { method: 'DELETE' });
  const updated = await res.json();
  setCfg(updated);
  window.dispatchEvent(new Event('modules-updated'));
    setActiveSub(null);
  };

  const saveRaw = async () => {
    try {
      const parsed = JSON.parse(rawEditor);
      if (activeSubmodule && activeModule) {
        const res = await fetch(`${apiBase}/${activeModule.id}/submodules/${activeSubmodule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
      const updated = await res.json();
      setCfg(updated);
      window.dispatchEvent(new Event('modules-updated'));
      } else if (activeModule) {
        const res = await fetch(`${apiBase}/${activeModule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
        const updated = await res.json();
        setCfg(updated);
        window.dispatchEvent(new Event('modules-updated'));
      } else {
        const res = await fetch(`${apiBase}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
        const updated = await res.json();
        setCfg(updated);
        window.dispatchEvent(new Event('modules-updated'));
      }
      alert('Guardado');
    } catch (e) {
      alert('JSON inválido');
    }
  };

  // Quick add helpers for a submodule
  // Quick add helpers removed to favor Appsmith-like workflow on the canvas

  // Simple visual editor bindings for core properties (name, route, description)
  const updateSubmoduleProp = (key: keyof Submodule, value: any) => {
    if (!activeModule || !activeSubmodule) return;
    const updated: Submodule = { ...activeSubmodule, [key]: value } as Submodule;
    setRawEditor(JSON.stringify(updated, null, 2));
  };

  // Provide a read-only view of default sidebar modules to help users map modules
  const defaultSidebar = useMemo(() => getDefaultSidebarGroups(), []);

  // Utilities
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Elementos del constructor visual removidos

  // Sync default sidebar groups/items into modules config
  const syncFromSidebar = async () => {
    const base = JSON.parse(JSON.stringify(cfg)) as ModulesConfig;
    for (const g of defaultSidebar) {
      const modId = `mod_${slugify(g.title)}`;
      let mod = base.modules.find(m => m.id === modId);
      if (!mod) {
        mod = { id: modId, name: g.title, enabled: true, order: (base.modules.length + 1), submodules: [] };
        base.modules.push(mod);
      }
      for (const it of g.items) {
        const subId = `sub_${slugify(it.href)}`;
        if (!(mod.submodules || []).some(s => s.id === subId)) {
          const sub: Submodule = { id: subId, name: it.label, route: it.href, description: `Auto-importado desde Sidebar (${g.title})` };
          mod.submodules = [...(mod.submodules || []), sub];
          // Scaffold pages for imported routes
          if (sub.route) {
            try { await fetch('/api/scaffold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ route: sub.route, title: sub.name }) }); } catch {}
          }
        }
      }
    }
    const res = await fetch(`${apiBase}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(base) });
  const updated = await res.json();
  setCfg(updated);
  window.dispatchEvent(new Event('modules-updated'));
    alert('Sincronización completa: módulos y submódulos importados desde Sidebar.');
  };

  // Save current submodule quickly from visual editor
  const saveActiveSubmodule = async () => {
    if (!activeModule || !activeSubmodule) return;
    try {
      const parsed = JSON.parse(rawEditor) as Submodule | AppModule | ModulesConfig;
      const sub: Submodule = (parsed as any).id ? parsed as Submodule : activeSubmodule;
      const res = await fetch(`${apiBase}/${activeModule.id}/submodules/${sub.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setCfg(await res.json());
      alert('Submódulo guardado');
    } catch {
      alert('No se pudo guardar: JSON inválido o estado inconsistente');
    }
  };

  // saveDesigner removed; use "Guardar submódulo" which persists the full submodule including layout

  return (
    <ListShell title="Módulos" subtitle="Crea y configura módulos, submódulos y sus componentes (tablas, botones, métricas, modales, formularios).">
      <div className="flex gap-6">
        {/* Left: modules & submodules tree */}
        <aside className="w-[280px] shrink-0">
          <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-gray-800">Listado</div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border px-2 py-1 text-xs" onClick={syncFromSidebar}>Sincronizar desde Sidebar</button>
              <button className="px-3 py-1 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }} onClick={addModule}>+ Módulo</button>
              {activeSubmodule && (
                <>
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={()=> downloadJson(activeSubmodule.id, activeSubmodule)}>Exportar submódulo</button>
                  <label className="rounded-md border px-2 py-1 text-xs cursor-pointer">
                    Importar<input type="file" accept="application/json" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) importSubmodule(f); }} />
                  </label>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {cfg.modules.length === 0 && <div className="text-xs text-gray-500">No hay módulos. Crea el primero.</div>}
            {modulesSorted.map((m, idx) => (
              <div key={m.id} className="border rounded-md">
                <div className={`flex items-center justify-between px-2 py-1 ${active===m.id?'bg-blue-50':''}`}>
                  <button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => { setActive(m.id); setActiveSub(null); }}>{m.name}</button>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {/* Orden actual y controles de movimiento */}
                    <span className="text-[11px] text-gray-500">#{m.order ?? (idx + 1)}</span>
                    <button
                      title="Subir"
                      className="rounded border px-1.5 py-0.5 text-xs disabled:opacity-40"
                      disabled={idx === 0}
                      onClick={() => moveModule(m.id, 'up')}
                    >↑</button>
                    <button
                      title="Bajar"
                      className="rounded border px-1.5 py-0.5 text-xs disabled:opacity-40"
                      disabled={idx === modulesSorted.length - 1}
                      onClick={() => moveModule(m.id, 'down')}
                    >↓</button>
                    <label className="text-xs inline-flex items-center gap-1">
                      <input type="checkbox" checked={m.enabled ?? true} onChange={async (e) => {
                        const body = { ...m, enabled: e.target.checked };
                        const res = await fetch(`${apiBase}/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                        const updated = await res.json();
                        setCfg(updated);
                        window.dispatchEvent(new Event('modules-updated'));
                      }} /> <span className="hidden sm:inline">Activo</span>
                    </label>
                    <button
                      aria-label="Eliminar módulo"
                      title="Eliminar"
                      className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeModule(m.id)}
                    >
                      {/* Trash can icon (inline SVG) */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h2V4h-2v1zM8 7h8v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zm2 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {active===m.id && (
                  <div className="p-2 space-y-1">
                    <button className="text-xs text-blue-600" onClick={addSubmodule}>+ Submódulo</button>
                    <div className="space-y-1">
                      {(m.submodules || []).map(s => (
                        <div key={s.id} className={`flex items-center justify-between rounded px-2 py-1 ${activeSub===s.id?'bg-gray-50':''}`}>
                          <button className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setActiveSub(s.id)}>{s.name}</button>
                          <div className="flex items-center gap-1">
                            <button
                              aria-label="Editar en Appsmith"
                              title="Editar en Appsmith"
                              className="rounded p-1 text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => openInAppsmith(m, s)}
                            >
                              {/* Pencil icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25zm15.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.92 3.92 1.83-1.83z"/>
                              </svg>
                            </button>
                          <button
                            aria-label="Eliminar submódulo"
                            title="Eliminar submódulo"
                            className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => removeSubmodule(s.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                              <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h2V4h-2v1zM8 7h8v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zm2 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/>
                            </svg>
                          </button>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border p-2">
            <div className="text-xs font-semibold text-gray-700 mb-2">Módulos por defecto (Sidebar)</div>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {defaultSidebar.map(g => (
                <div key={g.title}>
                  <div className="text-[11px] uppercase tracking-wider text-gray-500">{g.title}</div>
                  <ul className="ml-2 space-y-0.5">
                    {g.items.map(it => (
                      <li key={`${g.title}-${it.href}`} className="text-xs text-gray-600">
                        <span className="font-mono">{it.href}</span> – {it.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          </div>
        </aside>

        {/* Right: main content with tabs */}
        <section className="flex-1">
          {/* Top toolbar: breadcrumb + actions */}
          <div className="mb-3 flex items-center justify-between border-b bg-white/90 px-1 py-2">
            <div className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">Ajustes</span>
              <span className="mx-1">/</span>
              <span className="font-medium text-gray-700">Módulos</span>
              {activeModule && (
                <>
                  <span className="mx-1">/</span>
                  <span>{activeModule.name}</span>
                </>
              )}
              {activeSubmodule && (
                <>
                  <span className="mx-1">/</span>
                  <span className="text-gray-800">{activeSubmodule.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeSubmodule && (
                <>
                  <button
                    className="rounded-md border px-3 py-1 text-xs"
                    onClick={() => downloadJson(activeSubmodule.id, activeSubmodule)}
                  >
                    Exportar submódulo
                  </button>
                  <button
                    className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
                    disabled={!appsmithEnabled || !appsmithBase}
                    onClick={() => openInAppsmith(activeModule, activeSubmodule)}
                  >
                    Editar en Appsmith
                  </button>
                  <button
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white"
                    onClick={saveActiveSubmodule}
                  >
                    Guardar submódulo
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Warning banner if Appsmith is not configured */}
          {!appsmithEnabled && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              Appsmith no está configurado. Configura la URL del editor en <a href="/ajustes/integraciones" className="underline">Ajustes → Integraciones</a> o define la variable <code>NEXT_PUBLIC_APPSMITH_EDITOR_URL</code>.
            </div>
          )}

          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              {(['submodulo','editores','json'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setMainTab(t)}
                  className={`rounded-md border px-3 py-1 text-xs ${mainTab===t? 'bg-blue-50 border-blue-500 text-blue-700':'border-gray-300'}`}
                >
                  {t === 'submodulo' ? 'Submódulo' : t === 'editores' ? 'Editores' : 'JSON'}
                </button>
              ))}
            </div>

            {/* Submódulo tab */}
            {mainTab === 'submodulo' && (
              activeSubmodule ? (
                <>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-700">Propiedades del submódulo</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="grid gap-1 text-xs">
                        <span>Nombre</span>
                        <input className="rounded-md border px-2 py-1" value={activeSubmodule.name || ''} onChange={(e) => updateSubmoduleProp('name', e.target.value)} />
                      </label>
                      <label className="grid gap-1 text-xs">
                        <span>Ruta</span>
                        <input className="rounded-md border px-2 py-1" value={activeSubmodule.route || ''} onChange={(e) => updateSubmoduleProp('route', e.target.value)} placeholder="/mi-ruta" />
                      </label>
                      <label className="col-span-2 grid gap-1 text-xs">
                        <span>Descripción</span>
                        <input className="rounded-md border px-2 py-1" value={activeSubmodule.description || ''} onChange={(e) => updateSubmoduleProp('description', e.target.value)} />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500">Selecciona un submódulo para editar sus propiedades.</div>
              )
            )}

            {/* Editores tab */}
            {mainTab === 'editores' && (
              activeSubmodule ? (
                <div>
                  <div className="mb-2 flex gap-1">
                    {(['tables','actions','metrics','forms','modals'] as const).map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} className={`rounded-md border px-2 py-1 text-xs ${activeTab===t? 'bg-blue-50 border-blue-500 text-blue-700':'border-gray-300'}`}>{t}</button>
                    ))}
                  </div>
                  {activeTab === 'tables' && (
                    <TablesEditor sub={activeSubmodule} onChange={(s: Submodule)=> setRawEditor(JSON.stringify(s, null, 2))} />
                  )}
                  {activeTab === 'actions' && (
                    <ActionsEditor sub={activeSubmodule} onChange={(s: Submodule)=> setRawEditor(JSON.stringify(s, null, 2))} />
                  )}
                  {activeTab === 'metrics' && (
                    <MetricsEditor sub={activeSubmodule} onChange={(s: Submodule)=> setRawEditor(JSON.stringify(s, null, 2))} />
                  )}
                  {activeTab === 'forms' && (
                    <FormsEditor sub={activeSubmodule} onChange={(s: Submodule)=> setRawEditor(JSON.stringify(s, null, 2))} />
                  )}
                  {activeTab === 'modals' && (
                    <ModalsEditor sub={activeSubmodule} onChange={(s: Submodule)=> setRawEditor(JSON.stringify(s, null, 2))} />
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Selecciona un submódulo para usar los editores.</div>
              )
            )}

            {/* JSON tab */}
            {mainTab === 'json' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-800">Editor JSON</div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }} onClick={saveRaw}>Guardar</button>
                  </div>
                </div>
                <textarea className="h-[520px] w-full rounded-md border border-gray-300 p-2 font-mono text-xs" value={rawEditor} onChange={(e) => setRawEditor(e.target.value)} />
              </div>
            )}
          </div>
        </section>
      </div>
    </ListShell>
  );
}


function TablesEditor({ sub, onChange }: { sub: Submodule; onChange: (updated: Submodule) => void }) {
  const tables = sub.tables || [];
  const [local, setLocal] = useState<Submodule>(sub);
  useEffect(() => { setLocal(sub); }, [sub]);
  const setTables = (t: ModuleTable[]) => { const updated = { ...local, tables: t }; setLocal(updated); onChange(updated); };
  const up = (arr: any[], i: number) => (i>0 ? [arr[i-1], arr[i], ...arr.slice(i+1)].map((v, idx)=> (idx===0? v: idx===1? arr[i]: v)) : arr);
  const down = (arr: any[], i: number) => (i<arr.length-1 ? [...arr.slice(0,i), arr[i+1], arr[i], ...arr.slice(i+2)] : arr);
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Tablas</div>
      {tables.length === 0 && <div className="text-xs text-gray-500">Sin tablas. Usa “+ Tabla”.</div>}
      {tables.map((t, idx) => (
        <div key={t.id} className="rounded-md border p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold">Tabla {idx + 1}</div>
            <div className="flex items-center gap-2">
              <button className="text-xs" onClick={()=> setTables(down(tables, idx))}>↓</button>
              <button className="text-xs" onClick={()=> setTables(up(tables, idx))}>↑</button>
              <button className="text-xs" onClick={() => setTables([...tables, { ...t, id: `tbl_${Math.random().toString(36).slice(2,8)}` }])}>Duplicar</button>
              <button className="text-xs text-red-600" onClick={() => setTables(tables.filter(x => x.id !== t.id))}>Eliminar</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs">
              <span>DataSource URL</span>
              <input className="rounded-md border px-2 py-1" value={t.dataSource?.url || ''} onChange={(e) => setTables(tables.map(x => x.id===t.id ? { ...x, dataSource: { ...(x.dataSource||{}), url: e.target.value } } : x))} placeholder="/api/vehicles" />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Método</span>
              <select className="rounded-md border px-2 py-1" value={t.dataSource?.method || 'GET'} onChange={(e) => setTables(tables.map(x => x.id===t.id ? { ...x, dataSource: { url: x.dataSource?.url || '', path: x.dataSource?.path, method: e.target.value as any } } : x))}>
                {['GET','POST','PUT','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="col-span-2 grid gap-1 text-xs">
              <span>Path (opcional)</span>
              <input className="rounded-md border px-2 py-1" value={t.dataSource?.path || ''} onChange={(e) => setTables(tables.map(x => x.id===t.id ? { ...x, dataSource: { url: x.dataSource?.url || '', method: x.dataSource?.method, path: e.target.value } } : x))} placeholder="data.items" />
            </label>
          </div>
          <div className="mt-2">
            <div className="text-[11px] font-semibold text-gray-600 mb-1">Columnas</div>
            {(t.columns || []).map((c, ci) => (
              <div key={`${t.id}-${c.key}-${ci}`} className="mb-1 grid grid-cols-4 gap-2">
                <input className="rounded-md border px-2 py-1 text-xs" value={c.key} onChange={(e) => setTables(tables.map(x => x.id===t.id ? { ...x, columns: x.columns.map((y, yi) => yi===ci ? { ...y, key: e.target.value } : y) } : x))} placeholder="clave" />
                <input className="rounded-md border px-2 py-1 text-xs" value={c.label} onChange={(e) => setTables(tables.map(x => x.id===t.id ? { ...x, columns: x.columns.map((y, yi) => yi===ci ? { ...y, label: e.target.value } : y) } : x))} placeholder="Etiqueta" />
                <select className="rounded-md border px-2 py-1 text-xs" value={c.format || 'text'} onChange={(e) => setTables(tables.map(x => x.id===t.id ? { ...x, columns: x.columns.map((y, yi) => yi===ci ? { ...y, format: e.target.value as any } : y) } : x))}>
                  {['text','number','date','money','badge','link'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={() => setTables(tables.map(x => x.id===t.id ? { ...x, columns: x.columns.filter((_, yi) => yi!==ci) } : x))}>Quitar</button>
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={() => setTables(tables.map(x => x.id===t.id ? { ...x, columns: [...x.columns.slice(0,ci), x.columns[ci], ...x.columns.slice(ci)] } : x))}>Duplicar</button>
                </div>
              </div>
            ))}
            <button className="rounded-md border px-2 py-1 text-xs" onClick={() => setTables(tables.map(x => x.id===t.id ? { ...x, columns: [...x.columns, { key: 'campo', label: 'Campo' }] } : x))}>+ Columna</button>
          </div>
          {t.dataSource?.url && (
            <div className="mt-2">
              <button className="rounded-md border px-2 py-1 text-xs" onClick={async ()=>{
                try{ const r=await fetch('http://localhost:3002/api/modules/datasource',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({moduleId:'',submoduleId:'',tableId:t.id})}); const d=await r.json(); alert('Prueba datasource: '+ (d.rows?.length ?? 0)+' filas'); }catch{ alert('No se pudo probar'); }
              }}>Probar DataSource</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionsEditor({ sub, onChange }: { sub: Submodule; onChange: (updated: Submodule) => void }) {
  const actions = sub.actions || [];
  const [local, setLocal] = useState<Submodule>(sub);
  useEffect(() => { setLocal(sub); }, [sub]);
  const setActions = (a: ModuleAction[]) => { const updated = { ...local, actions: a }; setLocal(updated); onChange(updated); };
  const up = (arr: any[], i: number) => (i>0 ? [arr[i-1], arr[i], ...arr.slice(i+1)].map((v, idx)=> (idx===0? v: idx===1? arr[i]: v)) : arr);
  const down = (arr: any[], i: number) => (i<arr.length-1 ? [...arr.slice(0,i), arr[i+1], arr[i], ...arr.slice(i+2)] : arr);
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Acciones</div>
      {actions.length === 0 && <div className="text-xs text-gray-500">Sin acciones. Usa “+ Botón”.</div>}
      {actions.map((a, idx) => (
        <div key={a.id} className="rounded-md border p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold">Acción {idx + 1}</div>
            <div className="flex items-center gap-2">
              <button className="text-xs" onClick={()=> setActions(down(actions, idx))}>↓</button>
              <button className="text-xs" onClick={()=> setActions(up(actions, idx))}>↑</button>
              <button className="text-xs" onClick={()=> setActions([...actions, { ...a, id: `act_${Math.random().toString(36).slice(2,8)}` }])}>Duplicar</button>
              <button className="text-xs text-red-600" onClick={() => setActions(actions.filter(x => x.id !== a.id))}>Eliminar</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs">
              <span>Etiqueta</span>
              <input className="rounded-md border px-2 py-1" value={a.label} onChange={(e) => setActions(actions.map(x => x.id===a.id ? { ...x, label: e.target.value } : x))} />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Tipo</span>
              <select className="rounded-md border px-2 py-1" value={a.type} onChange={(e) => setActions(actions.map(x => x.id===a.id ? { ...x, type: e.target.value as any } : x))}>
                {['navigate','open-modal','run-api','export','custom'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="col-span-2 grid gap-1 text-xs">
              <span>Target</span>
              <input className="rounded-md border px-2 py-1" value={a.target || ''} onChange={(e) => setActions(actions.map(x => x.id===a.id ? { ...x, target: e.target.value } : x))} placeholder="/api/..., /ruta, modalId" />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Método</span>
              <select className="rounded-md border px-2 py-1" value={a.method || 'POST'} onChange={(e) => setActions(actions.map(x => x.id===a.id ? { ...x, method: e.target.value as any } : x))}>
                {['GET','POST','PUT','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs">
              <span>Permisos (roles, coma)</span>
              <input className="rounded-md border px-2 py-1" value={(a.permissions||[]).join(',')} onChange={(e) => setActions(actions.map(x => x.id===a.id ? { ...x, permissions: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } : x))} placeholder="DRIVER,SUPERVISOR,MANAGER" />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormsEditor({ sub, onChange }: { sub: Submodule; onChange: (updated: Submodule) => void }) {
  const forms = sub.forms || [];
  const [local, setLocal] = useState<Submodule>(sub);
  useEffect(() => { setLocal(sub); }, [sub]);
  const setForms = (f: ModuleForm[]) => { const updated = { ...local, forms: f }; setLocal(updated); onChange(updated); };
  const addField = (formId: string) => setForms((forms || []).map(fr => fr.id===formId ? { ...fr, fields: [...fr.fields, { key: 'campo', label: 'Campo', type: 'text', required: false }] } : fr));
  const fmtDate = (v?: number) => (typeof v === 'number' && !isNaN(v)) ? new Date(v).toISOString().slice(0,10) : '';
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Formularios</div>
      {forms.length === 0 && <div className="text-xs text-gray-500">Sin formularios. Usa “+ Formulario”.</div>}
      {forms.map((f) => (
        <div key={f.id} className="rounded-md border p-2">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs">
              <span>Título</span>
              <input className="rounded-md border px-2 py-1" value={f.title} onChange={(e) => setForms(forms.map(x => x.id===f.id ? { ...x, title: e.target.value } : x))} />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Acción de envío (submitActionId)</span>
              <input className="rounded-md border px-2 py-1" value={f.submitActionId || ''} onChange={(e) => setForms(forms.map(x => x.id===f.id ? { ...x, submitActionId: e.target.value } : x))} placeholder="act_xxxx" />
            </label>
          </div>
          <div className="text-[11px] font-semibold text-gray-600 mb-1">Campos</div>
          {(f.fields || []).map((field, fi) => (
            <div key={`${f.id}-${field.key}-${fi}`} className="mb-1 grid grid-cols-6 gap-2">
              <input className="rounded-md border px-2 py-1 text-xs col-span-1" value={field.key} onChange={(e) => setForms(forms.map(x => x.id===f.id ? { ...x, fields: x.fields.map((y, yi) => yi===fi ? { ...y, key: e.target.value } : y) } : x))} placeholder="key" />
              <input className="rounded-md border px-2 py-1 text-xs col-span-2" value={field.label} onChange={(e) => setForms(forms.map(x => x.id===f.id ? { ...x, fields: x.fields.map((y, yi) => yi===fi ? { ...y, label: e.target.value } : y) } : x))} placeholder="Etiqueta" />
              <select className="rounded-md border px-2 py-1 text-xs col-span-1" value={field.type} onChange={(e) => setForms(forms.map(x => x.id===f.id ? { ...x, fields: x.fields.map((y, yi) => yi===fi ? { ...y, type: e.target.value as any } : y) } : x))}>
                {['text','number','date','select','checkbox','textarea','file'].map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
              <label className="text-xs col-span-1 inline-flex items-center gap-1">
                <input type="checkbox" checked={field.required || false} onChange={(e) => setForms(forms.map(x => x.id===f.id ? { ...x, fields: x.fields.map((y, yi) => yi===fi ? { ...y, required: e.target.checked } : y) } : x))} /> requerido
              </label>
              {/* Basic validation inputs */}
              {(field.type==='text' || field.type==='textarea') && (
                <>
                  <input className="rounded-md border px-2 py-1 text-xs col-span-1" type="number" placeholder="minLen" value={field.minLength ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, minLength: e.target.value? Number(e.target.value): undefined } : y) } : x))} />
                  <input className="rounded-md border px-2 py-1 text-xs col-span-1" type="number" placeholder="maxLen" value={field.maxLength ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, maxLength: e.target.value? Number(e.target.value): undefined } : y) } : x))} />
                  <input className="rounded-md border px-2 py-1 text-xs col-span-2" placeholder="pattern (regex)" value={field.pattern ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, pattern: e.target.value || undefined } : y) } : x))} />
                </>
              )}
              {field.type==='number' && (
                <>
                  <input className="rounded-md border px-2 py-1 text-xs col-span-1" type="number" placeholder="min" value={field.min ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, min: e.target.value? Number(e.target.value): undefined } : y) } : x))} />
                  <input className="rounded-md border px-2 py-1 text-xs col-span-1" type="number" placeholder="max" value={field.max ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, max: e.target.value? Number(e.target.value): undefined } : y) } : x))} />
                </>
              )}
              {field.type==='date' && (
                <>
                  <input className="rounded-md border px-2 py-1 text-xs col-span-1" placeholder="min (YYYY-MM-DD)" value={fmtDate(field.min)} onChange={(e)=> {
                    const ts = e.target.value ? Date.parse(e.target.value) : NaN;
                    setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, min: isNaN(ts) ? undefined : ts } : y) } : x));
                  }} />
                  <input className="rounded-md border px-2 py-1 text-xs col-span-1" placeholder="max (YYYY-MM-DD)" value={fmtDate(field.max)} onChange={(e)=> {
                    const ts = e.target.value ? Date.parse(e.target.value) : NaN;
                    setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, max: isNaN(ts) ? undefined : ts } : y) } : x));
                  }} />
                </>
              )}
              <input className="rounded-md border px-2 py-1 text-xs col-span-2" placeholder="Mensaje de validación" value={field.message ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, message: e.target.value || undefined } : y) } : x))} />
              <input className="rounded-md border px-2 py-1 text-xs col-span-2" placeholder="Placeholder" value={field.placeholder ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, placeholder: e.target.value || undefined } : y) } : x))} />
              <input className="rounded-md border px-2 py-1 text-xs col-span-2" placeholder="Default" value={field.defaultValue ?? ''} onChange={(e)=> setForms(forms.map(x=> x.id===f.id ? { ...x, fields: x.fields.map((y, yi)=> yi===fi ? { ...y, defaultValue: e.target.value || undefined } : y) } : x))} />
              <button className="rounded-md border px-2 py-1 text-xs col-span-1" onClick={() => setForms(forms.map(x => x.id===f.id ? { ...x, fields: x.fields.filter((_, yi) => yi!==fi) } : x))}>Quitar</button>
              {field.type === 'select' && (
                <div className="col-span-6 grid grid-cols-6 gap-2">
                  <input className="rounded-md border px-2 py-1 text-xs col-span-5" placeholder="op1:Opción 1,op2:Opción 2" onBlur={(e) => {
                    const pairs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    const options = pairs.map(p => {
                      const [value, label] = p.includes(':') ? p.split(':') : [p, p];
                      return { value, label };
                    });
                    setForms(forms.map(x => x.id===f.id ? { ...x, fields: x.fields.map((y, yi) => yi===fi ? { ...y, options } : y) } : x));
                  }} />
                  <span className="text-[11px] text-gray-500 col-span-6">Formato: valor:Etiqueta,valor2:Etiqueta2 (blur para aplicar)</span>
                </div>
              )}
            </div>
          ))}
          <div className="mt-1 flex gap-2">
            <button className="rounded-md border px-2 py-1 text-xs" onClick={() => addField(f.id)}>+ Campo</button>
            <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={() => setForms(forms.filter(x => x.id !== f.id))}>Eliminar formulario</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricsEditor({ sub, onChange }: { sub: Submodule; onChange: (updated: Submodule) => void }) {
  const metrics = sub.metrics || [];
  const [local, setLocal] = useState<Submodule>(sub);
  useEffect(() => { setLocal(sub); }, [sub]);
  const setMetrics = (m: ModuleMetric[]) => { const updated = { ...local, metrics: m }; setLocal(updated); onChange(updated); };
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Métricas</div>
      {metrics.length === 0 && <div className="text-xs text-gray-500">Sin métricas. Usa “+ Métrica”.</div>}
      {metrics.map((m) => (
        <div key={m.id} className="rounded-md border p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold">{m.label || 'Métrica'}</div>
            <button className="text-xs text-red-600" onClick={() => setMetrics(metrics.filter(x => x.id !== m.id))}>Eliminar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs">
              <span>Etiqueta</span>
              <input className="rounded-md border px-2 py-1" value={m.label} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, label: e.target.value } : x))} />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Unidad</span>
              <input className="rounded-md border px-2 py-1" value={m.unit || ''} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, unit: e.target.value } : x))} />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Color</span>
              <input className="rounded-md border px-2 py-1" value={m.color || ''} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, color: e.target.value } : x))} placeholder="#2563eb" />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Expresión (fallback)</span>
              <input className="rounded-md border px-2 py-1" value={m.valueExpr || ''} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, valueExpr: e.target.value } : x))} placeholder="count(items)" />
            </label>
            <label className="col-span-2 grid gap-1 text-xs">
              <span>DataSource URL (opcional)</span>
              <input className="rounded-md border px-2 py-1" value={m.dataSource?.url || ''} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, dataSource: { ...(x.dataSource||{}), url: e.target.value } } : x))} placeholder="/api/metrics" />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Método</span>
              <select className="rounded-md border px-2 py-1" value={m.dataSource?.method || 'GET'} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, dataSource: { url: x.dataSource?.url || '', path: x.dataSource?.path, method: e.target.value as any } } : x))}>
                {['GET','POST','PUT','DELETE'].map(mm => <option key={mm} value={mm}>{mm}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs">
              <span>Path (opcional)</span>
              <input className="rounded-md border px-2 py-1" value={m.dataSource?.path || ''} onChange={(e)=> setMetrics(metrics.map(x=> x.id===m.id ? { ...x, dataSource: { url: x.dataSource?.url || '', method: x.dataSource?.method, path: e.target.value } } : x))} placeholder="vehicles" />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalsEditor({ sub, onChange }: { sub: Submodule; onChange: (updated: Submodule) => void }) {
  const modals = sub.modals || [];
  const forms = sub.forms || [];
  const [local, setLocal] = useState<Submodule>(sub);
  useEffect(() => { setLocal(sub); }, [sub]);
  const setModals = (m: ModuleModal[]) => { const updated = { ...local, modals: m }; setLocal(updated); onChange(updated); };
  const addModal = () => setModals([...(modals||[]), { id: `mdl_${Math.random().toString(36).slice(2,8)}`, title: 'Nuevo', contentType: 'form', formId: forms[0]?.id }]);
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Modales</div>
      {modals.length === 0 && <div className="text-xs text-gray-500">Sin modales. Usa “+ Modal”.</div>}
      <div className="flex gap-2 mb-2">
        <button className="rounded-md border px-2 py-1 text-xs" onClick={addModal}>+ Modal</button>
      </div>
      {modals.map((m) => (
        <div key={m.id} className="rounded-md border p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold">{m.title || m.id}</div>
            <button className="text-xs text-red-600" onClick={() => setModals(modals.filter(x => x.id !== m.id))}>Eliminar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs">
              <span>Título</span>
              <input className="rounded-md border px-2 py-1" value={m.title} onChange={(e)=> setModals(modals.map(x=> x.id===m.id ? { ...x, title: e.target.value } : x))} />
            </label>
            <label className="grid gap-1 text-xs">
              <span>Tipo de contenido</span>
              <select className="rounded-md border px-2 py-1" value={m.contentType} onChange={(e)=> setModals(modals.map(x=> x.id===m.id ? { ...x, contentType: e.target.value as any } : x))}>
                {['form','custom'].map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </label>
            {m.contentType === 'form' && (
              <label className="grid gap-1 text-xs col-span-2">
                <span>Formulario</span>
                <select className="rounded-md border px-2 py-1" value={m.formId || ''} onChange={(e)=> setModals(modals.map(x=> x.id===m.id ? { ...x, formId: e.target.value } : x))}>
                  <option value="">Seleccione</option>
                  {forms.map(fr => <option key={fr.id} value={fr.id}>{fr.title} ({fr.id})</option>)}
                </select>
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
