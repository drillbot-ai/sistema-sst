"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type NotificationsSettings = {
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smsEnabled: boolean;
  smsProvider?: 'twilio' | 'other' | '';
  smsFrom?: string;
};

export default function NotificacionesPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<NotificationsSettings>({
    emailEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smsEnabled: false,
    smsProvider: '',
    smsFrom: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.notifications) setCfg(data.notifications);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      alert("Notificaciones guardadas");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListShell title="Notificaciones" subtitle="Email y SMS básicos para alertas.">
      <div className="card p-6 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={cfg.emailEnabled} onChange={(e)=> setCfg({ ...cfg, emailEnabled: e.target.checked })} />
            <h3 className="font-medium">Email (SMTP)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span>Servidor SMTP</span>
              <input className="rounded-md border px-3 py-2 text-sm" value={cfg.smtpHost ?? ''} onChange={(e)=> setCfg({ ...cfg, smtpHost: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Puerto</span>
              <input type="number" className="rounded-md border px-3 py-2 text-sm" value={cfg.smtpPort ?? 587} onChange={(e)=> setCfg({ ...cfg, smtpPort: Number(e.target.value) || 587 })} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Usuario</span>
              <input className="rounded-md border px-3 py-2 text-sm" value={cfg.smtpUser ?? ''} onChange={(e)=> setCfg({ ...cfg, smtpUser: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Contraseña</span>
              <input type="password" className="rounded-md border px-3 py-2 text-sm" value={cfg.smtpPassword ?? ''} onChange={(e)=> setCfg({ ...cfg, smtpPassword: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={cfg.smsEnabled} onChange={(e)=> setCfg({ ...cfg, smsEnabled: e.target.checked })} />
            <h3 className="font-medium">SMS</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span>Proveedor</span>
              <select className="rounded-md border px-3 py-2 text-sm" value={cfg.smsProvider ?? ''} onChange={(e)=> setCfg({ ...cfg, smsProvider: e.target.value as any })}>
                <option value="">Seleccionar…</option>
                <option value="twilio">Twilio</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Remitente (From)</span>
              <input className="rounded-md border px-3 py-2 text-sm" value={cfg.smsFrom ?? ''} onChange={(e)=> setCfg({ ...cfg, smsFrom: e.target.value })} />
            </label>
          </div>
        </section>

        <div className="pt-2">
          <button onClick={save} disabled={saving} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ListShell>
  );
}
