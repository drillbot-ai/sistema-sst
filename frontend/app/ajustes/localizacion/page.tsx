"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type LocalizationSettings = {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  currency: string;
  numberFormat: string;
};

export default function LocalizacionPage() {
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<LocalizationSettings>({
    language: "es-CO",
    timezone: "America/Bogota",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    currency: "COP",
    numberFormat: "es-CO",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.localization) setCfg(data.localization);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:3002/api/settings/app/localization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      await res.json();
      alert("Localización guardada");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const languages = [
    { value: "es-CO", label: "Español (Colombia)" },
    { value: "es-MX", label: "Español (México)" },
    { value: "es-ES", label: "Español (España)" },
    { value: "en-US", label: "English (US)" },
  ];
  const timezones = [
    "America/Bogota",
    "America/Mexico_City",
    "America/Lima",
    "America/Santiago",
    "UTC",
  ];
  const currencies = ["COP", "USD", "EUR", "MXN", "PEN", "CLP"];

  return (
    <ListShell title="Localización" subtitle="Idioma, formato de números/fechas y zona horaria.">
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Idioma</span>
            <select className="rounded-md border px-3 py-2 text-sm" value={cfg.language} onChange={(e)=> setCfg({ ...cfg, language: e.target.value })}>
              {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Zona horaria</span>
            <select className="rounded-md border px-3 py-2 text-sm" value={cfg.timezone} onChange={(e)=> setCfg({ ...cfg, timezone: e.target.value })}>
              {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Formato de fecha</span>
            <input className="rounded-md border px-3 py-2 text-sm" value={cfg.dateFormat} onChange={(e)=> setCfg({ ...cfg, dateFormat: e.target.value })} placeholder="DD/MM/YYYY" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Formato de hora</span>
            <select className="rounded-md border px-3 py-2 text-sm" value={cfg.timeFormat} onChange={(e)=> setCfg({ ...cfg, timeFormat: e.target.value as any })}>
              <option value="24h">24 horas</option>
              <option value="12h">12 horas</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Moneda</span>
            <select className="rounded-md border px-3 py-2 text-sm" value={cfg.currency} onChange={(e)=> setCfg({ ...cfg, currency: e.target.value })}>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Formato numérico</span>
            <input className="rounded-md border px-3 py-2 text-sm" value={cfg.numberFormat} onChange={(e)=> setCfg({ ...cfg, numberFormat: e.target.value })} placeholder="es-CO" />
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
