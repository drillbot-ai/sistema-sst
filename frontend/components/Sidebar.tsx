"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar navigation for the SG‑SST system. Lists all top-level modules.
 * Active links are highlighted based on the current pathname.
 */
export default function Sidebar() {
  const pathname = usePathname();
  // Grouped navigation: Dashboard, Operaciones, Compras, RRHH, HSE, Alta Gerencia, Ajustes
  const groups: Array<{ title: string; items: { href: string; label: string }[] }> = [
    {
      title: "Dashboard",
      items: [
        { href: "/metrics", label: "Dashboard" },
      ],
    },
    {
      title: "Operaciones",
      items: [
        { href: "/", label: "Vehículos" },
        { href: "/inspecciones", label: "Inspecciones" },
        { href: "/mantenimientos", label: "Mantenimientos" },
        { href: "/accidentes", label: "Accidentes" },
        { href: "/polizas", label: "Pólizas" },
        { href: "/capacitaciones", label: "Capacitaciones" },
        { href: "/contratistas", label: "Contratistas" },
        { href: "/formularios", label: "Formularios" },
      ],
    },
    {
      title: "Compras",
      items: [
        { href: "/compras", label: "Resumen" },
        { href: "/compras/proveedores", label: "Proveedores" },
        { href: "/compras/ordenes", label: "Órdenes de compra" },
        { href: "/compras/requisiciones", label: "Requisiciones" },
        { href: "/compras/inventario", label: "Inventario" },
        { href: "/compras/facturas", label: "Facturas" },
      ],
    },
    {
      title: "RRHH",
      items: [
        { href: "/rrhh", label: "Resumen" },
        { href: "/rrhh/empleados", label: "Empleados" },
        { href: "/rrhh/nomina", label: "Nómina" },
        { href: "/rrhh/contratos", label: "Contratos" },
        { href: "/rrhh/ausentismo", label: "Ausentismo" },
        { href: "/rrhh/evaluaciones", label: "Evaluaciones" },
      ],
    },
    {
      title: "HSE",
      items: [
        { href: "/hse", label: "Resumen" },
        { href: "/hse/matriz-riesgos", label: "Matriz de riesgos" },
        { href: "/hse/indicadores", label: "Indicadores" },
        { href: "/hse/planes-accion", label: "Planes de acción" },
        { href: "/hse/documentos", label: "Documentos" },
      ],
    },
    {
      title: "Alta Gerencia",
      items: [
        { href: "/gerencia", label: "Tablero ejecutivo" },
        { href: "/gerencia/kpi", label: "KPI estratégicos" },
        { href: "/gerencia/informes", label: "Informes" },
        { href: "/gerencia/auditorias", label: "Auditorías" },
        { href: "/gerencia/cumplimiento", label: "Cumplimiento" },
      ],
    },
    {
      title: "Ajustes",
      items: [
        { href: "/ajustes", label: "Configuración" },
      ],
    },
  ];
  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
      <nav className="space-y-4 p-3">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map(({ href, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border border-blue-600 bg-blue-50 text-blue-700"
                        : "border border-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
