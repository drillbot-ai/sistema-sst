"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";
import Pagination from "../../components/Pagination";
import Link from "next/link";

interface Accident {
  id: number;
  date: string;
  vehiclePlate?: string;
  severity?: string;
  notes?: string;
}

export default function AccidentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useQuery<Accident[]>({
    queryKey: ["accidents", search, page],
    queryFn: async () => {
      const res = await axios.get<Accident[]>(
        `http://localhost:3001/api/accidents`,
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
      title="Accidentes"
      subtitle="Investigación y trazabilidad (Res. 1401/2007)."
      actions={
        <Link href="/accidentes/new" className="btn btn-primary">
          + Nuevo accidente
        </Link>
      }
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Casos" value={`${items.length}`} />
          <KPICard title="Graves" value="0" />
          <KPICard title="En investigación" value="0" />
          <KPICard title="IF/IS (demo)" value="0.00" />
        </section>
      }
    >
      <section className="card p-4 flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por placa o notas…"
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
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Placa</th>
                <th className="px-3 py-2 text-left">Severidad</th>
                <th className="px-3 py-2 text-left">Notas</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="p-4">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={4} className="p-4 text-red-600">
                    Error al cargar los accidentes.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-600">
                    No hay resultados.
                  </td>
                </tr>
              )}
              {items.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{a.vehiclePlate ?? "-"}</td>
                  <td className="px-3 py-2">{a.severity ?? "-"}</td>
                  <td className="px-3 py-2 truncate">{a.notes ?? "-"}</td>
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