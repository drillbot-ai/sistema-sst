"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";
import Pagination from "../../components/Pagination";

interface FormSummary {
  code: string;
  name: string;
}

export default function FormsListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, refetch } = useQuery<FormSummary[]>({
    queryKey: ["forms", search, page],
    queryFn: async () => {
      const res = await axios.get<FormSummary[]>(
        `http://localhost:3002/api/forms`,
        {
          params: {
            search,
            limit,
            offset: (page - 1) * limit,
          },
        }
      );
      return res.data;
    },
  });
  
  const forms = data ?? [];
  return (
    <ListShell
      title="Formularios"
      subtitle="Listado de formularios disponibles para diligenciar."
      actions={
        <button onClick={() => refetch()} className="btn">
          Actualizar
        </button>
      }
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Formularios" value={`${forms.length}`} />
          <KPICard title="Borradores" value="-" />
          <KPICard title="Pendientes" value="-" />
          <KPICard title="Enviados" value="-" />
        </section>
      }
    >
      {/* Search bar */}
      <section className="card p-4 flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por nombre o código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => {
            setPage(1);
            refetch();
          }}
          className="btn"
        >
          Buscar
        </button>
      </section>
      {/* Table */}
      <section className="card">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="p-4">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={3} className="p-4 text-red-600">
                    Error al cargar formularios.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && forms.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-600">
                    No hay formularios disponibles.
                  </td>
                </tr>
              )}
              {forms.map((f) => (
                <tr key={f.code} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {f.code}
                  </td>
                    <td className="px-3 py-2">{f.name}</td>
                    <td className="px-3 py-2">
                      <Link href={`/formularios/${f.code}`} className="btn">
                        Diligenciar
                      </Link>
                      <Link
                        href={`/formularios/${f.code}/submissions`}
                        className="btn ml-2"
                      >
                        Registros
                      </Link>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Mostrando {forms.length} ítems
          </div>
          <Pagination
            page={page}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      </section>
    </ListShell>
  );
}
