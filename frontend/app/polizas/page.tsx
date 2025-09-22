"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import ListShell from "../../components/ListShell";
import KPICard from "../../components/KPICard";
import Pagination from "../../components/Pagination";
import Link from "next/link";

interface Poliza {
  id: number;
  type: string;
  number: string;
  provider?: string | null;
  issueDate: string;
  expiryDate: string;
  value?: number | null;
  vehicle?: { plate: string } | null;
  fileUrl?: string | null;
}

export default function PolizasPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useQuery<Poliza[]>({
    queryKey: ["polizas", search, page],
    queryFn: async () => {
      const res = await axios.get<Poliza[]>(
        `http://localhost:3002/api/polizas`,
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
      title="Pólizas"
      subtitle="Soat, contractual, extracontractual y pólizas varias."
      actions={
        <Link href="/polizas/new" className="btn btn-primary">
          + Nueva póliza
        </Link>
      }
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total" value={`${items.length}`} />
          <KPICard title="Vencen 30 días" value="0" />
          <KPICard title="Sin documentos" value="0" />
          <KPICard title="Aseguradoras" value="-" />
        </section>
      }
    >
      <section className="card p-4 flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por número o placa…"
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
                <th className="px-3 py-2 text-left">Número</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Vehículo</th>
                <th className="px-3 py-2 text-left">Vencimiento</th>
                <th className="px-3 py-2 text-left">Archivo</th>
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
                    Error al cargar las pólizas.
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
              {items.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium text-gray-900">{p.number}</td>
                  <td className="px-3 py-2">{p.type}</td>
                  <td className="px-3 py-2">{p.vehicle?.plate || '-'}</td>
                  <td className="px-3 py-2">{new Date(p.expiryDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    {p.fileUrl ? (
                      <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Descargar
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
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
