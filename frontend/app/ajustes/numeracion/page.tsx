"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type Sequence = {
  key: string;
  prefix?: string;
  padding?: number;
  current: number;
  suffix?: string;
  enabled?: boolean;
};

export default function NumeracionPage() {
  const [saving, setSaving] = useState(false);
  const [seqs, setSeqs] = useState<Sequence[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3002/api/settings/app");
        const data = await res.json();
        if (data?.numbering?.sequences) setSeqs(data.numbering.sequences);
        else setSeqs([]);
      } catch {
        setSeqs([]);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:3002/api/settings/app/numbering", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequences: seqs }),
      });
      alert("Numeración guardada");
    } catch {
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const update = (i: number, patch: Partial<Sequence>) => {
    setSeqs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const remove = (i: number) => setSeqs((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setSeqs((prev) => [...prev, { key: "NUEVA", prefix: "", padding: 5, current: 0, suffix: "", enabled: true }]);

  return (
    <ListShell title="Numeración" subtitle="Control de prefijos, series y consecutivos.">
      <div className="card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Series</h3>
          <button onClick={add} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Agregar serie</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Clave</th>
                <th className="py-2 pr-4">Prefijo</th>
                <th className="py-2 pr-4">Relleno</th>
                <th className="py-2 pr-4">Actual</th>
                <th className="py-2 pr-4">Sufijo</th>
                <th className="py-2 pr-4">Activa</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {seqs.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-gray-500">No hay series configuradas.</td></tr>
              ) : seqs.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-4">
                    <input className="rounded-md border px-2 py-1 w-40" value={s.key} onChange={(e) => update(i, { key: e.target.value.toUpperCase() })} />
                  </td>
                  <td className="py-2 pr-4">
                    <input className="rounded-md border px-2 py-1 w-28" value={s.prefix ?? ''} onChange={(e) => update(i, { prefix: e.target.value })} />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" className="rounded-md border px-2 py-1 w-24" value={s.padding ?? 0} onChange={(e) => update(i, { padding: Number(e.target.value) || 0 })} />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" className="rounded-md border px-2 py-1 w-28" value={s.current} onChange={(e) => update(i, { current: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td className="py-2 pr-4">
                    <input className="rounded-md border px-2 py-1 w-28" value={s.suffix ?? ''} onChange={(e) => update(i, { suffix: e.target.value })} />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="checkbox" checked={!!s.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} />
                  </td>
                  <td className="py-2 pr-4">
                    <button onClick={() => remove(i)} className="p-2 text-red-600" title="Eliminar serie" aria-label="Eliminar serie">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9 3a1 1 0 00-1 1v1H5.5a.75.75 0 000 1.5h13a.75.75 0 000-1.5H16V4a1 1 0 00-1-1H9zm-2 6.25a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zM12.75 9.25a.75.75 0 10-1.5 0v7.5a.75.75 0 001.5 0v-7.5zM15.5 9.25a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
