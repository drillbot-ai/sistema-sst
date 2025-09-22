/**
 * A small card for displaying a KPI (key performance indicator) with an optional delta and hint.
 * Use this component inside a grid to show summary information.
 */
export default function KPICard({
  title,
  value,
  delta,
  hint,
}: {
  title: string;
  value: string;
  delta?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      {delta && <div className="mt-2 text-xs text-emerald-600">{delta}</div>}
      {hint && <div className="mt-2 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}
