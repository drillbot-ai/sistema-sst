"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type AutomationSettings = {
  jobsEnabled: boolean;
  dailySummary: boolean;
  weeklyCleanup: boolean;
};

export default function AutomatizacionesPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<AutomationSettings>({ jobsEnabled: false, dailySummary: false, weeklyCleanup: false });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.automation) setCfg(data.automation);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      alert("Automatizaciones guardadas");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Automatizaciones" subtitle="Tareas programadas básicas.">
      <div className="card p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.jobsEnabled} onChange={(e)=> setCfg({ ...cfg, jobsEnabled: e.target.checked })} />
          Habilitar trabajos programados
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.dailySummary} onChange={(e)=> setCfg({ ...cfg, dailySummary: e.target.checked })} />
          Resumen diario
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.weeklyCleanup} onChange={(e)=> setCfg({ ...cfg, weeklyCleanup: e.target.checked })} />
          Limpieza semanal
        </label>
        <div className="pt-2">
          <button onClick={save} disabled={saving} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ListShell>
  );
}
