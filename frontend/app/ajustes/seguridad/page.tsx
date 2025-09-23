"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type SecuritySettings = {
  passwordMinLength: number;
  passwordRequireNumber: boolean;
  passwordRequireUpper: boolean;
  passwordRequireSymbol: boolean;
  sessionIdleMinutes: number;
  twoFactorEnabled: boolean;
  allowSelfRegistration: boolean;
};

export default function SeguridadPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireNumber: true,
    passwordRequireUpper: true,
    passwordRequireSymbol: false,
    sessionIdleMinutes: 30,
    twoFactorEnabled: false,
    allowSelfRegistration: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.security) setCfg(data.security);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      alert("Seguridad guardada");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Seguridad" subtitle="Política de contraseñas, sesión y autenticación.">
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span>Longitud mínima de contraseña</span>
            <input type="number" className="rounded-md border px-3 py-2 text-sm" value={cfg.passwordMinLength} onChange={(e)=> setCfg({ ...cfg, passwordMinLength: Math.max(4, Number(e.target.value) || 4) })} />
          </label>
          <label className="flex items-center gap-2 text-sm mt-6 sm:mt-0">
            <input type="checkbox" checked={cfg.passwordRequireNumber} onChange={(e)=> setCfg({ ...cfg, passwordRequireNumber: e.target.checked })} />
            Requiere número
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cfg.passwordRequireUpper} onChange={(e)=> setCfg({ ...cfg, passwordRequireUpper: e.target.checked })} />
            Requiere mayúscula
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cfg.passwordRequireSymbol} onChange={(e)=> setCfg({ ...cfg, passwordRequireSymbol: e.target.checked })} />
            Requiere símbolo
          </label>
          <label className="grid gap-1 text-sm">
            <span>Tiempo de inactividad (minutos)</span>
            <input type="number" className="rounded-md border px-3 py-2 text-sm" value={cfg.sessionIdleMinutes} onChange={(e)=> setCfg({ ...cfg, sessionIdleMinutes: Math.max(5, Number(e.target.value) || 5) })} />
          </label>
          <label className="flex items-center gap-2 text-sm mt-6 sm:mt-0">
            <input type="checkbox" checked={cfg.twoFactorEnabled} onChange={(e)=> setCfg({ ...cfg, twoFactorEnabled: e.target.checked })} />
            Activar 2FA
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cfg.allowSelfRegistration} onChange={(e)=> setCfg({ ...cfg, allowSelfRegistration: e.target.checked })} />
            Permitir auto registro de usuarios
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
