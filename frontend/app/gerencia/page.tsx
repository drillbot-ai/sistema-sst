"use client";

import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";

export default function GerenciaPage() {
  return (
    <ListShell
      title="Gerencia"
      subtitle="Panel ejecutivo para la alta gerencia."
      actions={<></>}
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Indicadores clave" value="-" />
          <KPICard title="Cumplimiento SST" value="-" />
          <KPICard title="Costos operativos" value="-" />
          <KPICard title="Riesgos" value="-" />
        </section>
      }
    >
      <div className="card p-6 text-gray-600">
        En esta sección encontrarás dashboards e informes para la alta
        gerencia, con indicadores clave de desempeño y cumplimiento.
      </div>
    </ListShell>
  );
}