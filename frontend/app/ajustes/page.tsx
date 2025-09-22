"use client";

import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";

export default function AjustesPage() {
  return (
    <ListShell
      title="Ajustes"
      subtitle="Configuración y parámetros del sistema."
      actions={<></>}
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Roles" value="-" />
          <KPICard title="Usuarios" value="-" />
          <KPICard title="Parámetros" value="-" />
          <KPICard title="Notificaciones" value="-" />
        </section>
      }
    >
      <div className="card p-6 text-gray-600">
        Desde aquí podrás configurar roles, permisos, parámetros y otras
        opciones del sistema. Módulo en desarrollo.
      </div>
    </ListShell>
  );
}
