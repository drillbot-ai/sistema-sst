"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type IntegrationsSettings = {
  s3Enabled: boolean;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  appsmithEnabled?: boolean;
  appsmithEditorUrl?: string;
};

export default function IntegracionesPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<IntegrationsSettings>({
    s3Enabled: false,
    s3Bucket: '',
    s3Region: '',
    s3Endpoint: '',
    s3AccessKey: '',
    s3SecretKey: '',
    appsmithEnabled: false,
    appsmithEditorUrl: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.integrations) {
          // Ensure new keys exist with defaults
          setCfg((prev) => ({
            ...prev,
            ...data.integrations,
            appsmithEnabled: !!data.integrations.appsmithEnabled,
            appsmithEditorUrl: data.integrations.appsmithEditorUrl ?? '',
          }));
        }
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:3002/api/settings/app/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Respuesta no exitosa');
      }
      const updated = await res.json();
      if (updated?.integrations) {
        setCfg((prev) => ({
          ...prev,
          ...updated.integrations,
          appsmithEnabled: !!updated.integrations.appsmithEnabled,
          appsmithEditorUrl: updated.integrations.appsmithEditorUrl ?? '',
        }));
      }
      alert("Integraciones guardadas");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Integraciones" subtitle="Servicios externos: almacenamiento S3 y Appsmith (opcional).">
      <div className="card p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-medium">Appsmith</h3>
          <div className="text-xs text-gray-600">Configura la URL del editor de tu app en Appsmith para habilitar el botón "Editar en Appsmith" en los submódulos.</div>
          <div className="flex items-center gap-2 mt-1">
            <input type="checkbox" checked={cfg.appsmithEnabled || false} onChange={(e)=> setCfg({ ...cfg, appsmithEnabled: e.target.checked })} />
            <span>Habilitar Appsmith</span>
          </div>
          <label className="grid gap-1 text-sm mt-2">
            <span>URL del editor de Appsmith</span>
            <input className="rounded-md border px-3 py-2 text-sm" placeholder="https://app.appsmith.com/app/<org>/<app-name>/edit" value={cfg.appsmithEditorUrl ?? ''} onChange={(e)=> setCfg({ ...cfg, appsmithEditorUrl: e.target.value })} />
            <span className="text-xs text-gray-500">Debe apuntar a la vista de edición de tu app. Se agregarán parámetros <code>?moduleId=...&submoduleId=...</code>.</span>
          </label>
          <hr className="my-4" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={cfg.s3Enabled} onChange={(e)=> setCfg({ ...cfg, s3Enabled: e.target.checked })} />
          <h3 className="font-medium">Amazon S3 / S3 compatible</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span>Bucket</span>
            <input className="rounded-md border px-3 py-2 text-sm" value={cfg.s3Bucket ?? ''} onChange={(e)=> setCfg({ ...cfg, s3Bucket: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Región</span>
            <input className="rounded-md border px-3 py-2 text-sm" value={cfg.s3Region ?? ''} onChange={(e)=> setCfg({ ...cfg, s3Region: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Endpoint (opcional)</span>
            <input className="rounded-md border px-3 py-2 text-sm" placeholder="https://s3.amazonaws.com" value={cfg.s3Endpoint ?? ''} onChange={(e)=> setCfg({ ...cfg, s3Endpoint: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Access Key</span>
            <input className="rounded-md border px-3 py-2 text-sm" value={cfg.s3AccessKey ?? ''} onChange={(e)=> setCfg({ ...cfg, s3AccessKey: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Secret Key</span>
            <input type="password" className="rounded-md border px-3 py-2 text-sm" value={cfg.s3SecretKey ?? ''} onChange={(e)=> setCfg({ ...cfg, s3SecretKey: e.target.value })} />
          </label>
        </div>
        <div className="pt-2">
          <button onClick={save} disabled={saving} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ListShell>
  );
}
