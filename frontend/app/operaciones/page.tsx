"use client";

import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";

export default function OperacionesPage() {
  return (
    <ListShell
      title="Operaciones"
      subtitle="Módulo para gestionar operaciones del servicio."
      actions={<></>}
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Servicios en curso" value="-" />
          <KPICard title="Programados" value="-" />
          <KPICard title="Finalizados" value="-" />
          <KPICard title="Retrasos" value="-" />
        </section>
      }
    >
      <div className="card p-6 text-gray-600">
        Próximamente podrás gestionar y visualizar todas las operaciones del servicio
        de transporte aquí. Este módulo está en desarrollo.
      </div>
    </ListShell>
  );
}