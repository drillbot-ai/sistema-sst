"use client";

import { useEffect, useState } from "react";
import ListShell from "../../../components/ListShell";
import { useTheme } from "../../context/ThemeContext";

export default function EstilosPage() {
  const { theme, setTheme, isLoading } = useTheme();
  const [local, setLocal] = useState(theme);
  useEffect(() => {
    setLocal(theme);
  }, [theme]);

  const handleChange = (key: keyof typeof local, value: string) => {
    setLocal({ ...local, [key]: value });
  };

  const handleSave = async () => {
    await setTheme(local);
    alert("Estilos guardados");
  };

  return (
    <ListShell title="Estilos" subtitle="Configura colores, tipografías y tamaños.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
            <input type="color" value={local.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color secundario</label>
            <input type="color" value={local.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color acento</label>
            <input type="color" value={local.accentColor} onChange={(e) => handleChange('accentColor', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fondo</label>
            <input type="color" value={local.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto</label>
            <input type="color" value={local.foregroundColor} onChange={(e) => handleChange('foregroundColor', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipografía (font-family)</label>
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={local.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño base</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={local.baseFontSize} onChange={(e) => handleChange('baseFontSize', e.target.value)} placeholder="14px" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radio de borde</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={local.borderRadius} onChange={(e) => handleChange('borderRadius', e.target.value)} placeholder="0.5rem" />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={handleSave} disabled={isLoading} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              Guardar estilos
            </button>
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-4 text-sm text-gray-600">Vista previa</div>
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: local.backgroundColor,
              color: local.foregroundColor,
              fontFamily: local.fontFamily,
              fontSize: local.baseFontSize,
            }}
          >
            <h3 className="text-lg font-semibold mb-2">Encabezado</h3>
            <p className="mb-4">Texto de ejemplo con color de texto y tipografía aplicados.</p>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-white" style={{ backgroundColor: local.primaryColor, borderRadius: local.borderRadius }}>Primario</button>
              <button className="px-3 py-2 text-white" style={{ backgroundColor: local.secondaryColor, borderRadius: local.borderRadius }}>Secundario</button>
              <button className="px-3 py-2 text-white" style={{ backgroundColor: local.accentColor, borderRadius: local.borderRadius }}>Acento</button>
            </div>
          </div>
        </div>
      </div>
    </ListShell>
  );
}
