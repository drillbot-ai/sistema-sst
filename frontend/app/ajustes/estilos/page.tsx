"use client";

import { useEffect, useMemo, useState } from "react";
import ListShell from "../../../components/ListShell";
import { useTheme } from "../../context/ThemeContext";

export default function EstilosPage() {
  const { theme, setTheme, setMode, mode, isLoading, listPresets, savePreset, applyPreset, deletePreset, resetTheme, bundle } = useTheme() as any;
  const [activeTab, setActiveTab] = useState<'colors'|'typography'|'components'|'layout'|'presets'>('colors');
  const [local, setLocal] = useState(theme);
  const [presets, setPresets] = useState<string[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [fontProvider, setLocalFontProvider] = useState(bundle?.fontProvider || 'system');
  const googleFonts = [
    'Inter', 'Roboto', 'Poppins', 'Open Sans', 'Montserrat', 'Lato', 'Nunito', 'Rubik', 'Source Sans 3'
  ];
  const { setFontProvider } = useTheme() as any;

  useEffect(() => {
    setLocal(theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      const p = await listPresets().catch(() => []);
      setPresets(p);
    })();
  }, [listPresets]);

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

  const handleSavePreset = async () => {
    const name = newPresetName.trim();
    if (!name) return;
    await savePreset(name);
    const p = await listPresets();
    setPresets(p);
    setNewPresetName('');
  };

  const handleApplyPreset = async (name: string) => {
    await applyPreset(name);
  };
  const handleDeletePreset = async (name: string) => {
    await deletePreset(name);
    const p = await listPresets();
    setPresets(p);
  };

  const handleReset = async () => {
    await resetTheme();
    const p = await listPresets();
    setPresets(p);
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fondo</label>
                  <input type="color" value={local.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto</label>
                  <input type="color" value={local.foregroundColor} onChange={(e) => handleChange('foregroundColor', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Borde</label>
                  <input type="color" value={local.borderColor ?? '#e5e7eb'} onChange={(e) => handleChange('borderColor' as any, e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Panel</label>
                  <input type="color" value={local.panelColor ?? '#ffffff'} onChange={(e) => handleChange('panelColor' as any, e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                  <input type="color" value={local.linkColor ?? '#2563eb'} onChange={(e) => handleChange('linkColor' as any, e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muted BG</label>
                  <input type="color" value={local.mutedBgColor ?? '#f9fafb'} onChange={(e) => handleChange('mutedBgColor' as any, e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muted Text</label>
                  <input type="color" value={local.mutedTextColor ?? '#6b7280'} onChange={(e) => handleChange('mutedTextColor' as any, e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Success</label>
                  <input type="color" value={local.successColor ?? '#16a34a'} onChange={(e) => handleChange('successColor' as any, e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warning</label>
                  <input type="color" value={local.warningColor ?? '#f59e0b'} onChange={(e) => handleChange('warningColor' as any, e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error</label>
                <input type="color" value={local.errorColor ?? '#dc2626'} onChange={(e) => handleChange('errorColor' as any, e.target.value)} />
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
            <div className="space-y-4">
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

              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">Presets guardados</div>
                <div className="flex flex-wrap gap-2">
                  {presets.length === 0 && <div className="text-xs text-gray-500">No hay presets guardados.</div>}
                  {presets.map((p) => (
                    <div key={p} className="flex items-center gap-2 border rounded-md px-2 py-1">
                      <span className="text-sm">{p}</span>
                      <a className="text-xs text-gray-700" href={`http://localhost:3002/api/settings/theme/presets/${encodeURIComponent(p)}/export`} target="_blank" rel="noreferrer">Exportar</a>
                      <button onClick={() => handleApplyPreset(p)} className="text-xs text-blue-600">Aplicar</button>
                      <button onClick={() => handleDeletePreset(p)} className="text-xs text-red-600">Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm" placeholder="Nombre del preset" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
                <button onClick={handleSavePreset} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Guardar preset</button>
                <button onClick={handleReset} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Restablecer por defecto</button>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Proveedor de fuentes</div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => { await setFontProvider('system'); setLocalFontProvider('system'); }} className={`px-3 py-2 rounded-md border ${fontProvider==='system'?'bg-blue-50 border-blue-600 text-blue-700':'bg-white border-gray-300 text-gray-700'}`}>Sistema</button>
                  <button onClick={async () => { await setFontProvider('google', bundle?.googleFont || 'Inter'); setLocalFontProvider('google'); }} className={`px-3 py-2 rounded-md border ${fontProvider==='google'?'bg-blue-50 border-blue-600 text-blue-700':'bg-white border-gray-300 text-gray-700'}`}>Google</button>
                  {fontProvider === 'google' && (
                    <select className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-sm" defaultValue={bundle?.googleFont || 'Inter'} onChange={async (e) => {
                      await setFontProvider('google', e.target.value);
                    }}>
                      {googleFonts.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a className="px-3 py-2 rounded-md border border-gray-300 text-gray-700" href={`http://localhost:3002/api/settings/theme/presets/${encodeURIComponent('default')}/export`} target="_blank" rel="noreferrer">Exportar preset 'default'</a>
                <label className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 cursor-pointer">
                  Importar preset
                  <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const text = await f.text();
                    try {
                      const preset = JSON.parse(text);
                      const name = prompt('Nombre para el preset importado:', 'importado');
                      if (!name) return;
                      await fetch('http://localhost:3002/api/settings/theme/presets/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, preset }) });
                      const p = await listPresets();
                      setPresets(p);
                    } catch {}
                  }} />
                </label>
              </div>
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
