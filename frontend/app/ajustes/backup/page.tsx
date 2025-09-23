"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";

type BackupList = { files: string[] };

export default function BackupPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [moduleFiles, setModuleFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const list = async () => {
    try {
      const res = await fetch("http://localhost:3002/api/settings/backup/theme");
      const data = (await res.json()) as BackupList;
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (e) {
      console.error(e);
    }
    try {
      const res2 = await fetch("http://localhost:3002/api/settings/backup/modules");
      const data2 = (await res2.json()) as BackupList;
      setModuleFiles(Array.isArray(data2.files) ? data2.files : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    list();
  }, []);

  const snapshot = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:3002/api/settings/backup/theme/snapshot", { method: "POST" });
      await list();
      alert("Backup creado");
    } catch (e) {
      console.error(e);
      alert("Error creando backup");
    } finally {
      setLoading(false);
    }
  };

  const restore = async (file: string) => {
    if (!confirm(`Restaurar el tema desde ${file}?`)) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:3002/api/settings/backup/theme/${encodeURIComponent(file)}/restore`, { method: "POST" });
      alert("Tema restaurado");
    } catch (e) {
      console.error(e);
      alert("Error restaurando backup");
    } finally {
      setLoading(false);
    }
  };

  const download = (file: string) => {
    window.open(`http://localhost:3002/api/settings/backup/theme/${encodeURIComponent(file)}`, "_blank");
  };

  // Modules backups
  const snapshotModules = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:3002/api/settings/backup/modules/snapshot", { method: "POST" });
      await list();
      alert("Backup de módulos creado");
    } catch (e) {
      console.error(e);
      alert("Error creando backup de módulos");
    } finally {
      setLoading(false);
    }
  };

  const restoreModules = async (file: string) => {
    if (!confirm(`Restaurar módulos desde ${file}?`)) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:3002/api/settings/backup/modules/${encodeURIComponent(file)}/restore`, { method: "POST" });
      alert("Módulos restaurados");
    } catch (e) {
      console.error(e);
      alert("Error restaurando módulos");
    } finally {
      setLoading(false);
    }
  };

  const downloadModules = (file: string) => {
    window.open(`http://localhost:3002/api/settings/backup/modules/${encodeURIComponent(file)}`, "_blank");
  };

  const exportTheme = async () => {
    try {
      const res = await fetch("http://localhost:3002/api/settings/theme");
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `theme_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error exportando tema");
    }
  };

  const importTheme = async (file: File) => {
    try {
      const text = await file.text();
      const bundle = JSON.parse(text);
      await fetch("http://localhost:3002/api/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundle),
      });
      alert("Tema importado y aplicado");
    } catch (e) {
      console.error(e);
      alert("Archivo inválido");
    }
  };

  const resetTheme = async () => {
    if (!confirm("¿Restablecer el tema a los valores por defecto?")) return;
    try {
      await fetch("http://localhost:3002/api/settings/theme/reset", { method: "POST" });
      alert("Tema restablecido");
    } catch (e) {
      console.error(e);
      alert("Error al restablecer");
    }
  };

  return (
    <ListShell title="Backup y reset" subtitle="Respaldos, restauración y restablecimiento del tema.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">Snapshots de tema</h3>
          <p className="text-sm text-gray-600 mb-4">Crea y descarga respaldos de la configuración de estilos (tema).</p>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={snapshot} disabled={loading} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              {loading ? 'Creando…' : 'Crear backup ahora'}
            </button>
            <button onClick={list} className="px-3 py-2 rounded-md border">Refrescar</button>
            <button onClick={exportTheme} className="px-3 py-2 rounded-md border">Exportar tema actual</button>
            <label className="px-3 py-2 rounded-md border cursor-pointer">
              Importar tema
              <input type="file" accept="application/json" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importTheme(f);
              }} />
            </label>
            <button onClick={resetTheme} className="px-3 py-2 rounded-md border text-red-600">Restablecer por defecto</button>
          </div>
          <ul className="divide-y rounded-md border">
            {files.length === 0 && <li className="p-3 text-sm text-gray-500">No hay respaldos.</li>}
            {files.map((f) => (
              <li key={f} className="flex items-center justify-between p-3 text-sm">
                <span className="font-mono">{f}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => download(f)} className="px-2 py-1 rounded-md border">Descargar</button>
                  <button onClick={() => restore(f)} className="px-2 py-1 rounded-md border text-blue-600">Restaurar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">Snapshots de módulos</h3>
          <p className="text-sm text-gray-600 mb-4">Crea y gestiona respaldos de la configuración de Módulos (modules.json).</p>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={snapshotModules} disabled={loading} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              {loading ? 'Creando…' : 'Crear backup de módulos'}
            </button>
            <button onClick={list} className="px-3 py-2 rounded-md border">Refrescar</button>
          </div>
          <ul className="divide-y rounded-md border">
            {moduleFiles.length === 0 && <li className="p-3 text-sm text-gray-500">No hay respaldos.</li>}
            {moduleFiles.map((f) => (
              <li key={f} className="flex items-center justify-between p-3 text-sm">
                <span className="font-mono">{f}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadModules(f)} className="px-2 py-1 rounded-md border">Descargar</button>
                  <button onClick={() => restoreModules(f)} className="px-2 py-1 rounded-md border text-blue-600">Restaurar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ListShell>
  );
}
