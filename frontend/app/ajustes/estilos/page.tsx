"use client";

import { useEffect, useMemo, useState } from "react";
import ListShell from "../../../components/ListShell";
import { useTheme } from "../../context/ThemeContext";

export default function EstilosPage() {
  const { theme, setTheme, setMode, mode, isLoading } = useTheme();
  const [activeTab, setActiveTab] = useState<'colors'|'typography'|'components'|'layout'|'presets'>('colors');
  const [local, setLocal] = useState(theme);
  useEffect(() => {
    setLocal(theme);
  }, [theme]);

  const systemFonts = useMemo(() => [
    'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
    'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    'Roboto, Helvetica, Arial, sans-serif',
    'Ubuntu, Cantarell, "Fira Sans", "Droid Sans", Helvetica, Arial, sans-serif',
    'Georgia, Cambria, "Times New Roman", Times, serif',
    'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  ], []);

  const handleChange = (key: keyof typeof local, value: string) => {
    setLocal({ ...local, [key]: value });
  };

  const handleSave = async () => {
    await setTheme(local);
    alert("Estilos guardados");
  };

  return (
    <ListShell title="Estilos" subtitle="Configura el tema global de la aplicación.">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex flex-wrap gap-4">
          {[
            { id: 'colors', label: 'Colores 🎨' },
            { id: 'typography', label: 'Tipografía 🔤' },
            { id: 'components', label: 'Componentes 🧩' },
            { id: 'layout', label: 'Layout 📐' },
            { id: 'presets', label: 'Temas & Presets 🌗' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${activeTab===t.id? 'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>{t.label}</button>
          ))}
        </nav>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left panel: controls */}
        <div className="card p-6 space-y-4">
          {activeTab === 'colors' && (
            <>
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
            </>
          )}

          {activeTab === 'typography' && (
            <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipografía (font-family)</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={local.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)}>
              {systemFonts.map((f) => (
                <option key={f} value={f}>{f.split(',')[0]}</option>
              ))}
            </select>
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
            </>
          )}

          {activeTab === 'components' && (
            <div className="text-gray-600 text-sm">Próximamente: configuración de botones, inputs, cards, tablas, etc.</div>
          )}

          {activeTab === 'layout' && (
            <div className="text-gray-600 text-sm">Próximamente: densidad, espaciados, contenedores y breakpoints.</div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">Modo de tema</div>
                  <div className="text-xs text-gray-500">Cambia entre claro y oscuro</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMode('light')} className={`px-3 py-2 rounded-md border ${mode==='light'?'bg-blue-50 border-blue-600 text-blue-700':'bg-white border-gray-300 text-gray-700'}`}>Claro</button>
                  <button onClick={() => setMode('dark')} className={`px-3 py-2 rounded-md border ${mode==='dark'?'bg-blue-50 border-blue-600 text-blue-700':'bg-white border-gray-300 text-gray-700'}`}>Oscuro</button>
                </div>
              </div>
              <div className="text-gray-600 text-sm">Próximamente: gestión de presets (guardar/restaurar y compartir).</div>
            </div>
          )}
          <div className="pt-2">
            <button onClick={handleSave} disabled={isLoading} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              Guardar estilos
            </button>
          </div>
        </div>
        {/* Right panel: live preview */}
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
