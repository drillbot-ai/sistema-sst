"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar navigation for the SG‑SST system. Lists all top-level modules.
 * Active links are highlighted based on the current pathname.
 */
export default function Sidebar() {
  const pathname = usePathname();
  // Define the navigation structure here. Each entry contains the href and label.
  const items = [
    { href: "/", label: "Vehículos" },
    { href: "/inspecciones", label: "Inspecciones" },
    { href: "/mantenimientos", label: "Mantenimientos" },
    { href: "/accidentes", label: "Accidentes" },
    { href: "/polizas", label: "Pólizas" },
    { href: "/capacitaciones", label: "Capacitaciones" },
    { href: "/contratistas", label: "Contratistas" },
    { href: "/formularios", label: "Formularios" },
    { href: "/operaciones", label: "Operaciones" },
    { href: "/compras", label: "Compras" },
    { href: "/gerencia", label: "Gerencia" },
    { href: "/ajustes", label: "Ajustes" },
  ];
  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
      <nav className="space-y-1 p-3">
        {items.map(({ href, label }) => {
          const active = pathname === href;
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
      </nav>
    </aside>
  );
}
