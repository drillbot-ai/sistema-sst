"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import ListShell from "../../../components/ListShell";
import KPICard from "../../../components/KPICard";
import { useAuth } from "../../context/AuthContext";

type ModuleAction = { id: string; label: string; type: 'navigate' | 'open-modal' | 'run-api' | 'export' | 'custom'; target?: string; method?: 'GET'|'POST'|'PUT'|'DELETE'; permissions?: string[] };
type ModuleTableColumn = { key: string; label: string; width?: number | string; sortable?: boolean; format?: 'text'|'number'|'date'|'money'|'badge'|'link' };
type ModuleTable = { id: string; dataKey?: string; dataSource?: { url: string; method?: 'GET'|'POST'|'PUT'|'DELETE'; path?: string }; columns: ModuleTableColumn[]; striped?: boolean; pageSize?: number };
type ModuleMetric = { id: string; label: string; valueExpr?: string; unit?: string; color?: string; dataSource?: { url: string; method?: 'GET'|'POST'|'PUT'|'DELETE'; path?: string } };
type ModuleFormField = { key: string; label: string; type: 'text'|'number'|'date'|'select'|'checkbox'|'textarea'|'file'; required?: boolean; options?: Array<{ value: string; label: string }>; min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string; message?: string; placeholder?: string; defaultValue?: any };
type ModuleForm = { id: string; title: string; submitActionId?: string; fields: ModuleFormField[] };
type ModuleModal = { id: string; title: string; contentType: 'form'|'custom'; formId?: string };
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
type AppModule = { id: string; name: string; enabled?: boolean; submodules?: Submodule[] };
type ModulesConfig = { version: number; modules: AppModule[] };

const apiBase = 'http://localhost:3002';

export default function DynamicModulePage() {
  const pathname = usePathname();
  const { token, user } = useAuth();
  const [cfg, setCfg] = useState<ModulesConfig | null>(null);
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tableRows, setTableRows] = useState<Record<string, any[]>>({});
  const [metricValues, setMetricValues] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/settings/modules`);
        const data = await res.json();
        setCfg(data);
      } catch {}
    })();
  }, []);

  const match = useMemo(() => {
    if (!cfg) return null;
    const p = pathname || '';
    const isUnderModulos = p.startsWith('/modulos');
    const rest = isUnderModulos ? p.replace(/^\/modulos\/?/, '/') : p;
    for (const m of cfg.modules) {
      if (m.enabled === false) continue;
      for (const s of (m.submodules || [])) {
        const route = s.route || '';
        if (route && (rest === route || rest.startsWith(route + '/'))) {
          return { module: m, sub: s };
        }
        // Fallback: if navigating like /modulos/<subId or slug>
        const slugOnly = rest.startsWith('/') ? rest.slice(1) : rest;
        if (slugOnly && (s.id === slugOnly || s.id.endsWith(slugOnly))) {
          return { module: m, sub: s };
        }
      }
    }
    return null;
  }, [cfg, pathname]);

  // Fetch table datasources when submodule changes
  useEffect(() => {
    (async () => {
      if (!match?.module || !match.sub) return;
      const sub = match.sub;
      const rowsById: Record<string, any[]> = {};
      for (const t of (sub.tables || [])) {
        if (!t.dataSource?.url) continue;
        try {
          const res = await fetch(`${apiBase}/api/modules/datasource`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ moduleId: match.module.id, submoduleId: sub.id, tableId: t.id, params: {} }),
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.rows)) rowsById[t.id] = data.rows;
          else rowsById[t.id] = [];
        } catch {
          rowsById[t.id] = [];
        }
      }
      setTableRows(rowsById);
    })();
  }, [match?.module?.id, match?.sub?.id, token]);

  // Fetch metric values
  useEffect(() => {
    (async () => {
      if (!match?.module || !match.sub) return;
      const sub = match.sub;
      const values: Record<string, any> = {};
      for (const m of (sub.metrics || [])) {
        if (!m.dataSource?.url) continue;
        try {
          const res = await fetch(`${apiBase}/api/modules/fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ moduleId: match.module.id, submoduleId: sub.id, metricId: m.id, params: {} }),
          });
          const data = await res.json();
          if (res.ok) values[m.id] = data.value ?? data.data;
        } catch {}
      }
      setMetricValues(values);
    })();
  }, [match?.module?.id, match?.sub?.id, token]);

  const execAction = async (action: ModuleAction) => {
    try {
      const res = await fetch(`${apiBase}/api/modules/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ actionId: action.id, moduleId: match?.module.id, submoduleId: match?.sub.id, payload: formData }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Error ejecutando acción');
        return;
      }
      if (data.type === 'open-modal') {
        setOpenModalId(String(data.target || ''));
      } else if (data.type === 'navigate' && typeof data.target === 'string') {
        window.location.href = data.target;
      } else if (data.type === 'run-api' && typeof data.target === 'string') {
        alert(`Acción API permitida: ${data.method} ${data.target}`);
      } else if (data.type === 'export') {
        alert('Exportación solicitada');
      }
    } catch (e) {
      alert('Fallo ejecutando la acción');
    }
  };

  const modal = useMemo(() => {
    if (!match?.sub || !openModalId) return null;
    return (match.sub.modals || []).find((m) => m.id === openModalId) || null;
  }, [match, openModalId]);

  const form = useMemo(() => {
    if (!match?.sub) return null;
    if (modal?.contentType === 'form' && modal.formId) {
      return (match.sub.forms || []).find((f) => f.id === modal!.formId) || null;
    }
    return null;
  }, [match, modal]);

  // Initialize defaults when form changes
  useEffect(() => {
    if (!form) return;
    const init: Record<string, any> = {};
    for (const f of form.fields) {
      if (f.defaultValue !== undefined) init[f.key] = f.defaultValue;
    }
    if (Object.keys(init).length > 0) setFormData((prev) => ({ ...init, ...prev }));
  }, [form?.id]);

  // Simple client-side validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form) return errs;
    for (const f of form.fields) {
      const val = formData[f.key];
      if (f.required) {
        const isEmpty = (val === undefined || val === null || val === '' || (f.type==='checkbox' && !val));
        if (isEmpty) { errs[f.key] = f.message || 'Requerido'; continue; }
      }
      if (f.type === 'text' || f.type === 'textarea') {
        if (typeof val === 'string') {
          if (f.minLength && val.length < f.minLength) errs[f.key] = f.message || `Mínimo ${f.minLength} caracteres`;
          if (!errs[f.key] && f.maxLength && val.length > f.maxLength) errs[f.key] = f.message || `Máximo ${f.maxLength} caracteres`;
          if (!errs[f.key] && f.pattern) {
            try { const re = new RegExp(f.pattern); if (!re.test(val)) errs[f.key] = f.message || 'Formato inválido'; } catch {}
          }
        }
      }
      if (f.type === 'number' && typeof val === 'number') {
        if (f.min !== undefined && val < f.min) errs[f.key] = f.message || `Debe ser >= ${f.min}`;
        if (!errs[f.key] && f.max !== undefined && val > f.max) errs[f.key] = f.message || `Debe ser <= ${f.max}`;
      }
      if (f.type === 'date' && typeof val === 'string') {
        const ts = Date.parse(val);
        if (!isNaN(ts)) {
          if (typeof f.min === 'number' && ts < f.min) errs[f.key] = f.message || 'Fecha demasiado temprana';
          if (!errs[f.key] && typeof f.max === 'number' && ts > f.max) errs[f.key] = f.message || 'Fecha demasiado tardía';
        }
      }
    }
    setFormErrors(errs);
    return errs;
  };

  const canSee = (act: ModuleAction) => {
    if (!act.permissions || act.permissions.length === 0) return true;
    if (!user?.role) return false;
    return act.permissions.includes(user.role);
  };

  if (!cfg || !match) {
    return (
      <ListShell title="Módulos" subtitle="Cargando...">
        <div className="card p-6 text-gray-600">Cargando configuración...</div>
      </ListShell>
    );
  }

  const s = match.sub;

  // Helpers to render a widget
  const renderActions = (actionIds?: string[]) => {
    const acts = (s.actions || []).filter(canSee);
    const list = actionIds && actionIds.length>0 ? acts.filter(a => actionIds.includes(a.id)) : acts;
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        {list.map((a) => (
          <button key={a.id} className="rounded-md border border-gray-300 px-3 py-2 text-sm" onClick={() => execAction(a)}>
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  const renderTable = (tId: string) => {
    const t = (s.tables || []).find(x => x.id === tId);
    if (!t) return null;
    return (
      <div key={t.id} className="mb-6 overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {t.columns.map((c) => (
                <th key={c.key} className="px-3 py-2 text-left font-semibold text-gray-700">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(tableRows[t.id] || []).map((row, idx) => (
              <tr key={idx}>
                {t.columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-gray-700">{String(row?.[c.key] ?? '—')}</td>
                ))}
              </tr>
            ))}
            {(!tableRows[t.id] || tableRows[t.id].length === 0) && (
              <tr>
                <td colSpan={t.columns.length} className="px-3 py-4 text-center text-gray-500">Sin datos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMetric = (mId: string) => {
    const m = (s.metrics || []).find(x => x.id === mId);
    if (!m) return null;
    return <KPICard key={m.id} title={m.label} value={(metricValues[m.id] ?? m.valueExpr) || '—'} hint={m.unit} />;
  };

  const renderWidget = (w: LayoutWidget) => {
    switch (w.type) {
      case 'actions': return renderActions(w.actionIds);
      case 'table': return renderTable(w.tableId);
      case 'metric': return (
        <div className="mb-4 grid grid-cols-1 gap-3">{renderMetric(w.metricId)}</div>
      );
      case 'form':
        // Render a button to open the modal that contains this form (if any)
        if (w.formId) {
          const modalForForm = (s.modals || []).find(m => m.formId === w.formId);
          if (modalForForm) {
            return (
              <button
                key={w.id}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                onClick={() => setOpenModalId(modalForForm.id)}
              >
                Abrir formulario
              </button>
            );
          }
        }
        return <div className="text-sm text-gray-500">Formulario no configurado</div>;
      case 'text': return <div className="text-sm text-gray-700" key={w.id}>{w.text}</div>;
      default: return null;
    }
  };

  const hasLayout = !!s.layout && Array.isArray(s.layout.rows) && s.layout.rows.length>0;

  const spanClass = (n: number) => {
    const map: Record<number, string> = {
      1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
      5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
      9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
    };
    const clamped = Math.min(Math.max(n, 1), 12);
    return map[clamped];
  };

  return (
    <ListShell title={s.name} subtitle={s.description || 'Módulo dinámico configurado desde Ajustes > Módulos'}>
      {!hasLayout && (
        <>
          {renderActions()}
          {s.metrics && s.metrics.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {s.metrics.map((m) => (
                <KPICard key={m.id} title={m.label} value={(metricValues[m.id] ?? m.valueExpr) || '—'} hint={m.unit} />
              ))}
            </div>
          )}
          {(s.tables || []).map(t => renderTable(t.id))}
        </>
      )}

      {hasLayout && (
        <div className="space-y-4">
          {(s.layout!.rows).map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-3">
              {row.columns.map(col => (
                <div key={col.id} className={spanClass(col.span)}>
                  {col.widgets.map(w => (
                    <div key={w.id}>{renderWidget(w)}</div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal / Form renderer */}
      {modal && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-800">{modal.title}</div>
              <button className="text-sm text-gray-500" onClick={() => setOpenModalId(null)}>Cerrar</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const errs = validateForm();
                if (Object.keys(errs).length > 0) return;
                const submitAction = (s.actions || []).find((a) => a.id === form.submitActionId) || (s.actions || [])[0];
                if (submitAction) await execAction(submitAction);
              }}
              className="space-y-3"
            >
              {form.fields.map((f) => (
                <div key={f.key} className="grid gap-1">
                  <label className="text-xs font-medium text-gray-700">{f.label}</label>
                  {f.type === 'text' && (
                    <input className={`rounded-md border px-3 py-2 ${formErrors[f.key]? 'border-red-500' : 'border-gray-300'}`} placeholder={f.placeholder} defaultValue={f.defaultValue} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                  )}
                  {f.type === 'number' && (
                    <input type="number" className={`rounded-md border px-3 py-2 ${formErrors[f.key]? 'border-red-500' : 'border-gray-300'}`} placeholder={f.placeholder} defaultValue={f.defaultValue} onChange={(e) => setFormData({ ...formData, [f.key]: Number(e.target.value) })} />
                  )}
                  {f.type === 'date' && (
                    <input type="date" className={`rounded-md border px-3 py-2 ${formErrors[f.key]? 'border-red-500' : 'border-gray-300'}`} placeholder={f.placeholder} defaultValue={f.defaultValue} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                  )}
                  {f.type === 'select' && (
                    <select className={`rounded-md border px-3 py-2 ${formErrors[f.key]? 'border-red-500' : 'border-gray-300'}`} defaultValue={f.defaultValue ?? ''} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}>
                      <option value="">Seleccione</option>
                      {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                  {f.type === 'checkbox' && (
                    <input type="checkbox" className={`h-4 w-4 ${formErrors[f.key]? 'outline outline-1 outline-red-500' : ''}`} defaultChecked={!!f.defaultValue} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.checked })} />
                  )}
                  {f.type === 'textarea' && (
                    <textarea className={`rounded-md border px-3 py-2 ${formErrors[f.key]? 'border-red-500' : 'border-gray-300'}`} placeholder={f.placeholder} defaultValue={f.defaultValue} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                  )}
                  {f.type === 'file' && (
                    <input type="file" className="rounded-md border border-gray-300 px-3 py-2" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const data = await file.arrayBuffer();
                      const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
                      const contentType = file.type || 'application/octet-stream';
                      const dataUrl = `data:${contentType};base64,${base64}`;
                      setFormData({ ...formData, [f.key]: dataUrl, [`${f.key}Name`]: file.name });
                    }} />
                  )}
                  {formErrors[f.key] && <div className="text-[11px] text-red-600">{formErrors[f.key]}</div>}
                </div>
              ))}
              <div className="pt-2">
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ListShell>
  );
}
