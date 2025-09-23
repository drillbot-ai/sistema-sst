"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type AuditSettings = {
  auditEnabled: boolean;
  retentionDays: number;
};

export default function AuditoriaPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<AuditSettings>({ auditEnabled: true, retentionDays: 90 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.audit) setCfg(data.audit);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      alert("Auditoría guardada");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Auditoría" subtitle="Trazabilidad y retención de eventos.">
      <div className="card p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.auditEnabled} onChange={(e)=> setCfg({ ...cfg, auditEnabled: e.target.checked })} />
          Habilitar auditoría de cambios
        </label>
        <label className="grid gap-1 text-sm max-w-xs">
          <span>Días de retención</span>
          <input type="number" className="rounded-md border px-3 py-2 text-sm" value={cfg.retentionDays} onChange={(e)=> setCfg({ ...cfg, retentionDays: Math.max(1, Number(e.target.value) || 1) })} />
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
