"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import ListShell from "../components/ListShell";
import KPICard from "../components/KPICard";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import VehicleForm from "../components/VehicleFormComplete";

interface Vehicle {
  id: number;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;
  const queryClient = useQueryClient();
  const {
    data: vehicles,
    isLoading,
    isError,
    refetch,
  } = useQuery<Vehicle[]>({
    queryKey: ["vehicles", search, page],
    queryFn: async () => {
      const res = await axios.get<Vehicle[]>(
        `http://localhost:3002/api/vehicles`,
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

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      const response = await axios.post(`http://localhost:3002/api/vehicles`, vehicleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsModalOpen(false);
    },
  });

  const handleCreateVehicle = async (data: any) => {
    await createVehicleMutation.mutateAsync(data);
  };

  const handleExportVehicle = async (vehicleId: number, format: 'html' | 'excel' | 'pdf') => {
    try {
      let url = '';
      let filename = '';
      
      switch (format) {
        case 'html':
          url = `http://localhost:3002/api/vehicles/${vehicleId}/export/html`;
          filename = `vehiculo-${vehicleId}-formulario.html`;
          break;
        case 'pdf':
          url = `http://localhost:3002/api/vehicles/${vehicleId}/export/pdf`;
          filename = `vehiculo-${vehicleId}-formulario.pdf`;
          break;
        case 'excel':
          // Para Excel, usaremos el HTML y lo convertiremos
          url = `http://localhost:3002/api/vehicles/${vehicleId}/export/html`;
          filename = `vehiculo-${vehicleId}-formulario.xls`;
          break;
      }

      const response = await axios.get(url, {
        responseType: format === 'pdf' ? 'blob' : 'text',
      });

      // Crear un enlace de descarga
      const blob = format === 'pdf' 
        ? response.data 
        : new Blob([response.data], { 
            type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/html' 
          });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo de exportación');
    }
  };
  const items = vehicles ?? [];
  return (
    <ListShell
      title="Flota de vehículos"
      subtitle="Control de hojas de vida, pólizas y mantenimientos."
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn bg-blue-600 text-white hover:bg-blue-700"
          >
            + Agregar Vehículo
          </button>
          <button
            onClick={() => refetch()}
            className="btn"
          >
            Actualizar
          </button>
        </div>
      }
      kpis={
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Vehículos activos" value={`${items.length}`} />
          <KPICard title="Vencen este mes" value="3" delta="+1 respecto al mes pasado" />
          <KPICard title="En mantenimiento" value="1" />
          <KPICard title="Disponibilidad" value="96.5%" />
        </section>
      }
    >
      {/* Search bar */}
      <section className="card p-4 flex items-center gap-2">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Buscar por placa o marca…"
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
                <th className="px-3 py-2 text-left">Placa</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-left">Modelo</th>
                <th className="px-3 py-2 text-left">Año</th>
                <th className="px-3 py-2 text-left">Acciones</th>
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
                    Error al cargar vehículos.
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
              {items.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium text-gray-900">{v.plate}</td>
                  <td className="px-3 py-2">{v.brand ?? "-"}</td>
                  <td className="px-3 py-2">{v.model ?? "-"}</td>
                  <td className="px-3 py-2">{v.year ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleExportVehicle(v.id, 'html')}
                        className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded border"
                        title="Exportar a HTML"
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => handleExportVehicle(v.id, 'excel')}
                        className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded border"
                        title="Exportar a Excel"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => handleExportVehicle(v.id, 'pdf')}
                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded border"
                        title="Exportar a PDF"
                      >
                        PDF
                      </button>
                    </div>
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
      
      {/* Modal para agregar vehículo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agregar Nuevo Vehículo - GO-FO-01"
        size="xl"
      >
        <VehicleForm
          onSubmit={handleCreateVehicle}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createVehicleMutation.isPending}
        />
      </Modal>
    </ListShell>
  );
}
