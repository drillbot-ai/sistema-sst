"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";
import Pagination from "../../components/Pagination";
import Link from "next/link";

interface Training {
  id: number;
  title: string;
  topic?: string | null;
  date: string;
}

export default function TrainingsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useQuery<Training[]>({
    queryKey: ["trainings", search, page],
    queryFn: async () => {
      const res = await axios.get<Training[]>(
        `http://localhost:3002/api/capacitaciones`,
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
  const items = data ?? [];
  return (
    <ListShell
      title="Capacitaciones"
      subtitle="Plan de formación, asistencia y evaluaciones."
      actions={
        <Link href="/capacitaciones/new" className="btn btn-primary">
          + Nueva capacitación
        </Link>
      }
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Eventos" value={`${items.length}`} />
          <KPICard title="Asistentes (prom.)" value="-" />
          <KPICard title="Cumplimiento anual" value="-" />
          <KPICard title="Próximas 30 días" value="-" />
        </section>
      }
    >
      <section className="card p-4 flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por título…"
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
      <section className="card">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Tema</th>
                <th className="px-3 py-2 text-left">Fecha</th>
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
                    Error al cargar las capacitaciones.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-600">
                    No hay resultados.
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium text-gray-900">{c.title}</td>
                  <td className="px-3 py-2">{c.topic ?? '-'}</td>
                  <td className="px-3 py-2">{new Date(c.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">Mostrando {items.length} ítems</div>
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
