"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import WidgetPropertiesPanel from "./WidgetPropertiesPanel";

export type Widget =
  | { id: string; type: "metric"; label: string }
  | { id: string; type: "table"; title: string }
  | { id: string; type: "form"; title: string }
  | { id: string; type: "text"; text: string };

type Props = {
  widgets: Widget[];
  onChange: (widgets: Widget[]) => void;
};

const ModuleDesigner = ({ widgets, onChange }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor));
  const [items, setItems] = useState<Widget[]>(widgets);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => setItems(widgets), [widgets]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      onChange(reordered);
    }
  };

  const addWidget = (type: Widget["type"]) => {
    const id = `w_${Math.random().toString(36).slice(2, 8)}`;
    let next: Widget[];
    if (type === "text") {
      next = [...items, { id, type: "text", text: "Texto" } as Widget];
    } else if (type === "metric") {
      next = [...items, { id, type: "metric", label: "Métrica" } as Widget];
    } else if (type === "table") {
      next = [...items, { id, type: "table", title: "Tabla" } as Widget];
    } else {
      next = [...items, { id, type: "form", title: "Formulario" } as Widget];
    }
    setItems(next);
    onChange(next);
    setSelectedId(id);
  };

  const updateWidget = (updated: Widget) => {
    const updatedList = items.map((it) => (it.id === updated.id ? updated : it));
    setItems(updatedList);
    onChange(updatedList);
  };

  const selectedWidget = selectedId ? items.find((w) => w.id === selectedId) || null : null;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-2">
        <div className="flex gap-2 mb-2">
          {["metric", "table", "form", "text"].map((t) => (
            <button
              key={t}
              className="rounded-md border px-2 py-1 text-sm"
              onClick={() => addWidget(t as any)}
            >
              + {t}
            </button>
          ))}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
            {items.map((w) => (
              <SortableItem key={w.id} id={w.id}>
                <div
                  className={`border rounded-md p-3 bg-white cursor-pointer ${selectedId === w.id ? "ring ring-blue-400" : ""}`}
                  onClick={() => setSelectedId(w.id)}
                >
                  {w.type === "metric" && (
                    <span>
                      📊 {w.label} {((w as any).color ? <span style={{ color: (w as any).color }}>●</span> : null)}
                    </span>
                  )}
                  {w.type === "table" && <span>📋 {w.title}</span>}
                  {w.type === "form" && <span>📝 {w.title}</span>}
                  {w.type === "text" && <span>🅣 {(w as any).text}</span>}
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="card p-3">
        <WidgetPropertiesPanel widget={selectedWidget} onChange={updateWidget} />
      </div>
    </div>
  );
};

export default ModuleDesigner;
