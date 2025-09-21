"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";
import Pagination from "../../components/Pagination";
import Link from "next/link";

interface Contractor {
  id: number;
  name: string;
  nit: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  rating?: number;
}

export default function ContractorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useQuery<Contractor[]>({
    queryKey: ["contractors", search, page],
    queryFn: async () => {
      const res = await axios.get<Contractor[]>(
        `http://localhost:3001/api/contractors`,
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
      title="Contratistas"
      subtitle="Evaluación y cumplimiento (incluye SARLAFT y Norsok S-006)."
      actions={
        <Link href="/contratistas/new" className="btn btn-primary">
          + Nuevo contratista
        </Link>
      }
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total" value={`${items.length}`} />
          <KPICard title="Habilitados" value="-" />
          <KPICard title="Con alertas" value="-" />
          <KPICard title="Promedio rating" value="-" />
        </section>
      }
    >
      <section className="card p-4 flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por nombre o NIT…"
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
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">NIT</th>
                <th className="px-3 py-2 text-left">Contacto</th>
                <th className="px-3 py-2 text-left">Teléfono</th>
                <th className="px-3 py-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-4">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={5} className="p-4 text-red-600">
                    Error al cargar los contratistas.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-600">
                    No hay resultados.
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-3 py-2">{c.nit}</td>
                  <td className="px-3 py-2">{c.contact || '-'}</td>
                  <td className="px-3 py-2">{c.phone || '-'}</td>
                  <td className="px-3 py-2">{c.email || '-'}</td>
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