import React from "react";
import { Widget } from "./ModuleDesigner";

interface Props {
  widget: Widget | null;
  onChange: (updated: Widget) => void;
}

export default function WidgetPropertiesPanel({ widget, onChange }: Props) {
  if (!widget) {
    return <div className="text-sm text-gray-500">Seleccione un widget.</div>;
  }

  const update = (changes: Partial<Widget>) =>
    onChange({ ...widget, ...(changes as any) });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">
        Propiedades: {widget.type} ({widget.id})
      </h4>

      {widget.type === "text" && (
        <label className="block text-sm">
          Texto:
          <input
            className="border px-2 py-1 w-full"
            value={(widget as any).text ?? ""}
            onChange={(e) => update({ text: e.target.value } as any)}
          />
        </label>
      )}

      {widget.type === "metric" && (
        <>
          <label className="block text-sm">
            Etiqueta:
            <input
              className="border px-2 py-1 w-full"
              value={(widget as any).label ?? ""}
              onChange={(e) => update({ label: e.target.value } as any)}
            />
          </label>
          <label className="block text-sm">
            Color:
            <input
              type="color"
              className="border px-2 py-1 w-full h-8"
              value={(widget as any).color ?? "#2563eb"}
              onChange={(e) => update({ color: e.target.value } as any)}
            />
          </label>
        </>
      )}

      {widget.type === "table" && (
        <label className="block text-sm">
          Título:
          <input
            className="border px-2 py-1 w-full"
            value={(widget as any).title ?? ""}
            onChange={(e) => update({ title: e.target.value } as any)}
          />
        </label>
      )}

      {widget.type === "form" && (
        <label className="block text-sm">
          Título:
          <input
            className="border px-2 py-1 w-full"
            value={(widget as any).title ?? ""}
            onChange={(e) => update({ title: e.target.value } as any)}
          />
        </label>
      )}
    </div>
  );
}
