"use client";

import { useState } from "react";

/**
 * Generic form renderer based on a simple schema definition. Supports basic field types,
 * dynamic table rows and checklist groups. This component is controlled: it calls
 * onChange whenever the form data changes.
 */
export default function FormRenderer({
  schema,
  value,
  onChange,
}: {
  schema: any;
  value: any;
  onChange: (v: any) => void;
}) {
  const [data, setData] = useState(value || {});
  function setField(id: string, val: any) {
    const updated = { ...data, [id]: val };
    setData(updated);
    onChange(updated);
  }
  if (!schema) return null;
  return (
    <div className="space-y-6">
      {schema.sections.map((section: any) => (
        <section key={section.id} className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-base font-semibold text-gray-900">{section.title}</h3>
          {section.type === "table" ? (
            <TableSection
              section={section}
              value={data[section.id] || []}
              onChange={(v: any) => setField(section.id, v)}
            />
          ) : section.type === "checklist" ? (
            <ChecklistSection
              section={section}
              value={data[section.id] || {}}
              onChange={(v: any) => setField(section.id, v)}
            />
          ) : (
            <FieldGrid fields={section.fields} data={data} setField={setField} />
          )}
        </section>
      ))}
    </div>
  );
}

function FieldGrid({
  fields,
  data,
  setField,
}: {
  fields: any[];
  data: any;
  setField: (id: string, v: any) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((f) => {
        const value = data[f.id] ?? "";
        return (
          <div key={f.id} className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">{f.label}</label>
            {f.type === "text" && (
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
              />
            )}
            {f.type === "number" && (
              <input
                type="number"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={value}
                onChange={(e) => setField(f.id, e.target.value === "" ? "" : Number(e.target.value))}
              />
            )}
            {f.type === "date" && (
              <input
                type="date"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
              />
            )}
            {f.type === "time" && (
              <input
                type="time"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
              />
            )}
            {f.type === "select" && (
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
              >
                <option value="">Seleccione…</option>
                {f.options?.map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {f.type === "signature" && (
              <div className="h-24 w-full rounded-lg border border-gray-200 bg-gray-50 text-center text-xs text-gray-500">
                [Firma]
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChecklistSection({
  section,
  value,
  onChange,
}: {
  section: any;
  value: any;
  onChange: (v: any) => void;
}) {
  const levels = section.levels || ["OK", "NO", "NA"];
  return (
    <div className="space-y-2">
      {section.items.map((item: any) => {
        const entry = value[item.id] || {};
        return (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-40 text-sm text-gray-700">{item.label}</div>
            <select
              className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={entry.status || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [item.id]: { ...(value[item.id] || {}), status: e.target.value },
                })
              }
            >
              <option value="">-</option>
              {levels.map((lvl: string) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            <input
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Observación"
              value={entry.note || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [item.id]: { ...(value[item.id] || {}), note: e.target.value },
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function TableSection({
  section,
  value,
  onChange,
}: {
  section: any;
  value: any[];
  onChange: (v: any[]) => void;
}) {
  const rows = value.length ? value : Array.from({ length: 5 }, () => ({}));
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            {section.columns.map((col: any) => (
              <th
                key={col.id}
                className="border-b border-gray-200 bg-gray-50 px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, rowIndex: number) => (
            <tr key={rowIndex}>
              {section.columns.map((col: any) => (
                <td key={col.id} className="border-b border-gray-200 px-2 py-1 text-sm">
                  <input
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={row[col.id] || ""}
                    onChange={(e) => {
                      const updated = rows.map((r, i) => (i === rowIndex ? { ...r, [col.id]: e.target.value } : r));
                      onChange(updated);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
