"use client";

import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";

export default function ComprasPage() {
  return (
    <ListShell
      title="Compras"
      subtitle="Módulo para gestionar compras y adquisiciones."
      actions={<></>}
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Órdenes en proceso" value="-" />
          <KPICard title="Proveedores activos" value="-" />
          <KPICard title="Pendientes de aprobación" value="-" />
          <KPICard title="Facturas" value="-" />
        </section>
      }
    >
      <div className="card p-6 text-gray-600">
        Este módulo te permitirá gestionar tus órdenes de compra, proveedores
        y facturas en un solo lugar. Actualmente está en desarrollo.
      </div>
    </ListShell>
  );
}