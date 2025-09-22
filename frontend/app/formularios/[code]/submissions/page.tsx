"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import ListShell from "../../../../components/ListShell";
import Pagination from "../../../../components/Pagination";

interface Submission {
  id: string;
  status: string;
  createdAt: string;
}

export default function FormSubmissionsPage() {
  const { code } = useParams<{ code: string }>();
  const { data, isLoading, isError, refetch } = useQuery<Submission[]>({
    queryKey: ["formSubs", code],
    queryFn: async () => {
      const res = await axios.get<Submission[]>(
        `http://localhost:3002/api/forms/${code}/submissions`
      );
      return res.data;
    },
  });
  const submissions = data ?? [];
  return (
    <ListShell
      title={`Registros – ${code}`}
      subtitle="Historial de envíos de este formulario"
      actions={
        <button onClick={() => refetch()} className="btn">
          Actualizar
        </button>
      }
    >
      <section className="card">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Exportar</th>
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
                  <td colSpan={4} className="p-4 text-rose-600">
                    Error al cargar registros.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && submissions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-600">
                    Sin registros para este formulario.
                  </td>
                </tr>
              )}
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-sm text-gray-900">
                    {sub.id}
                  </td>
                  <td className="px-3 py-2 capitalize">{sub.status.toLowerCase()}</td>
                  <td className="px-3 py-2">
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`http://localhost:3002/api/submissions/${sub.id}/pdf`}
                      target="_blank"
                      className="btn"
                    >
                      PDF
                    </Link>
                    <Link
                      href={`http://localhost:3002/api/submissions/${sub.id}/xlsx`}
                      target="_blank"
                      className="btn ml-2"
                    >
                      Excel
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Mostrando {submissions.length} ítems
          </div>
          <Pagination page={1} onPrev={() => {}} onNext={() => {}} />
        </div>
      </section>
    </ListShell>
  );
}