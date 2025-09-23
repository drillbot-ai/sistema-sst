"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type AdvancedSettings = {
  enableExperimental: boolean;
  allowUnsafeEval: boolean;
};

export default function AvanzadoPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<AdvancedSettings>({ enableExperimental: false, allowUnsafeEval: false });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.advanced) setCfg(data.advanced);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/advanced", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      alert("Avanzado guardado");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Avanzado" subtitle="Opciones experimentales y de bajo nivel.">
      <div className="card p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.enableExperimental} onChange={(e)=> setCfg({ ...cfg, enableExperimental: e.target.checked })} />
          Habilitar características experimentales
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.allowUnsafeEval} onChange={(e)=> setCfg({ ...cfg, allowUnsafeEval: e.target.checked })} />
          Permitir eval inseguro (no recomendado)
        </label>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">Advertencia: estas opciones pueden afectar la seguridad y estabilidad del sistema. Úselas bajo su propia responsabilidad.</p>
        <div className="pt-2">
          <button onClick={save} disabled={saving} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ListShell>
  );
}
