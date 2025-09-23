"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type TemplatesSettings = {
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
};

export default function PlantillasPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<TemplatesSettings>({ headerText: '', footerText: '', logoUrl: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.templates) setCfg(data.templates);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      alert("Plantillas guardadas");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Plantillas" subtitle="Encabezado/pie y logo para documentos.">
      <div className="card p-6 space-y-4">
        <label className="grid gap-1 text-sm">
          <span>Logo URL</span>
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="https://..." value={cfg.logoUrl ?? ''} onChange={(e)=> setCfg({ ...cfg, logoUrl: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Texto de encabezado</span>
          <textarea className="rounded-md border px-3 py-2 text-sm" rows={3} value={cfg.headerText ?? ''} onChange={(e)=> setCfg({ ...cfg, headerText: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Texto de pie de página</span>
          <textarea className="rounded-md border px-3 py-2 text-sm" rows={3} value={cfg.footerText ?? ''} onChange={(e)=> setCfg({ ...cfg, footerText: e.target.value })} />
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
