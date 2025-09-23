"use client";

import { useEffect, useState } from "react";
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
  const [openDownloadMenuId, setOpenDownloadMenuId] = useState<number | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<null | { id: number }>(null);
  const [initialFormValues, setInitialFormValues] = useState<any>(null);
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

  // Metrics to avoid static KPI values
  const { data: metrics } = useQuery<{ vehicles: number } | undefined>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:3002/api/metrics`);
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
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Error al guardar el vehículo';
      alert(`No se pudo guardar el vehículo: ${msg}`);
      console.error('Create vehicle error:', err?.response?.data || err);
    }
  });

  const handleCreateVehicle = async (data: any) => {
    const payload = {
      plate: (data.plate ?? '').trim(),
      brand: data.brand || undefined,
      model: data.model || undefined,
      manufacturingYear: data.manufacturingYear ?? data.year ?? undefined,
      serialNumber: data.serialNumber || undefined,
      vehiclePhoto: data.vehiclePhoto || undefined,
      documents: Array.isArray(data.documents)
        ? data.documents.map((d: any) => ({
            type: d.type,
            number: d.number,
            issuer: d.issuer,
            issueDate: d.issueDate,
            expireDate: d.expireDate,
            fileData: d.fileData,
            fileName: d.fileName,
          }))
        : [],
      maintenanceHistory: Array.isArray(data.maintenanceHistory)
        ? data.maintenanceHistory.map((m: any) => ({
            date: m.date,
            type: m.type,
            description: m.description,
            cost: m.cost,
            photos: Array.isArray(m.photos) ? m.photos : [],
          }))
        : [],
    };
    await createVehicleMutation.mutateAsync(payload);
  };

  // Helper: map form values to submission.data shape used by backend exports
  const buildSubmissionPayload = (data: any) => {
    return {
      identification: {
        serialNumber: data.serialNumber || '',
        brand: data.brand || '',
        year: data.manufacturingYear ?? data.year ?? '',
        registrationDate: data.registrationDate || '',
        model: data.model || '',
        color: data.color || '',
        motorNumber: data.motorNumber || '',
        fuel: data.fuel || '',
        line: data.line || '',
        series: data.series || '',
        vehicleClass: data.vehicleClass || '',
        customsManifest: data.customsManifest || '',
        registrationCard: data.registrationCard || '',
        mileage: data.mileage || '',
        plate: (data.plate ?? '').trim(),
      },
      owner: {
        ownerCompany: data.ownerCompany || '',
        ownerNit: data.ownerNit || '',
        ownerAddress: data.ownerAddress || '',
        ownerNeighborhood: data.ownerNeighborhood || '',
        ownerPhone: data.ownerPhone || '',
        ownerMobile: data.ownerMobile || '',
        ownerCity: data.ownerCity || '',
        ownerMunicipality: data.ownerMunicipality || '',
      },
      updatedBy: Array.isArray(data.updatedBy) ? data.updatedBy : [],
      vehiclePhoto: data.vehiclePhoto || '',
      documents: Array.isArray(data.documents) ? data.documents : [],
      maintenanceHistory: Array.isArray(data.maintenanceHistory) ? data.maintenanceHistory : [],
    };
  };

  // Update (edit) mutation: update base vehicle and form submission
  const updateVehicleMutation = useMutation({
    mutationFn: async (payload: { id: number; base: any; form: any }) => {
      const { id, base, form } = payload;
      await axios.put(`http://localhost:3002/api/vehicles/${id}`, base);
      await axios.put(`http://localhost:3002/api/vehicles/${id}/form`, form);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsModalOpen(false);
      setEditingVehicle(null);
      setInitialFormValues(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Error al actualizar el vehículo';
      alert(`No se pudo actualizar el vehículo: ${msg}`);
      console.error('Update vehicle error:', err?.response?.data || err);
    }
  });

  const handleEditVehicle = async (data: any) => {
    if (!editingVehicle) return;
    const base = {
      plate: (data.plate ?? '').trim(),
      brand: data.brand || undefined,
      model: data.model || undefined,
      year: data.manufacturingYear ?? data.year ?? undefined,
      vin: data.serialNumber || undefined,
    };
    const form = buildSubmissionPayload(data);
    await updateVehicleMutation.mutateAsync({ id: editingVehicle.id, base, form });
  };

  // Open create modal: prefill owner from default company
  const openCreateModal = async () => {
    try {
      setEditingVehicle(null);
      setInitialFormValues(null);
      const res = await axios.get('http://localhost:3002/api/company');
      const company = res.data || {};
      const ownerDefaults = {
        ownerCompany: company.name || '',
        ownerNit: company.nit || '',
        ownerAddress: company.address || '',
        ownerNeighborhood: company.neighborhood || '',
        ownerPhone: company.phone || '',
        ownerMobile: company.mobile || '',
        ownerCity: company.city || '',
        ownerMunicipality: company.municipality || '',
        ownerSummary: company.name || '',
      };
      setInitialFormValues(ownerDefaults);
    } catch (e) {
      // Si falla, igual abrimos el modal vacío
      console.warn('No se pudo cargar la empresa por defecto para prellenar propietario');
    } finally {
      setIsModalOpen(true);
    }
  };

  // Open edit modal: fetch vehicle detail and map to initial values
  const openEditModal = async (id: number) => {
    try {
      const res = await axios.get(`http://localhost:3002/api/vehicles/${id}/detail`);
      const { vehicle, company, submission } = res.data || {};
      const d = submission?.data || {};
      const ident = d.identification || {};
      const owner = d.owner || {};
      const init = {
        // Vehicle identification
        serialNumber: ident.serialNumber ?? vehicle?.vin ?? '',
        brand: ident.brand ?? vehicle?.brand ?? '',
        manufacturingYear: ident.year ?? vehicle?.year ?? null,
        registrationDate: ident.registrationDate ?? '',
        model: ident.model ?? vehicle?.model ?? '',
        color: ident.color ?? '',
        motorNumber: ident.motorNumber ?? '',
        fuel: ident.fuel ?? '',
        line: ident.line ?? '',
        series: ident.series ?? '',
        vehicleClass: ident.vehicleClass ?? '',
        customsManifest: ident.customsManifest ?? '',
        registrationCard: ident.registrationCard ?? '',
        mileage: ident.mileage ?? '',
        plate: vehicle?.plate ?? '',
        // Owner: prefer submission, then company
        ownerCompany: owner.ownerCompany ?? company?.name ?? '',
        ownerNit: owner.ownerNit ?? company?.nit ?? '',
        ownerAddress: owner.ownerAddress ?? company?.address ?? '',
        ownerNeighborhood: owner.ownerNeighborhood ?? company?.neighborhood ?? '',
        ownerPhone: owner.ownerPhone ?? company?.phone ?? '',
        ownerMobile: owner.ownerMobile ?? company?.mobile ?? '',
        ownerCity: owner.ownerCity ?? company?.city ?? '',
        ownerMunicipality: owner.ownerMunicipality ?? company?.municipality ?? '',
        ownerSummary: owner.ownerCompany ?? company?.name ?? '',
        // Extras
        vehiclePhoto: d.vehiclePhoto ?? '',
        documents: Array.isArray(d.documents) ? d.documents : [],
        maintenanceHistory: Array.isArray(d.maintenanceHistory) ? d.maintenanceHistory : [],
        updatedBy: Array.isArray(d.updatedBy) ? d.updatedBy : [],
      };
      setEditingVehicle({ id });
      setInitialFormValues(init);
      setIsModalOpen(true);
    } catch (e: any) {
      console.error('Fallo detalle, usando fallback vehicle+company:', e?.response?.data || e);
      try {
        const [vehRes, compRes] = await Promise.all([
          axios.get(`http://localhost:3002/api/vehicles/${id}`),
          axios.get('http://localhost:3002/api/company').catch(() => ({ data: {} })),
        ]);
        const vehicle = vehRes.data || {};
        const company = compRes.data || {};
        const init = {
          serialNumber: vehicle?.vin ?? '',
          brand: vehicle?.brand ?? '',
          manufacturingYear: vehicle?.year ?? null,
          model: vehicle?.model ?? '',
          plate: vehicle?.plate ?? '',
          ownerCompany: company?.name ?? '',
          ownerNit: company?.nit ?? '',
          ownerAddress: company?.address ?? '',
          ownerNeighborhood: company?.neighborhood ?? '',
          ownerPhone: company?.phone ?? '',
          ownerMobile: company?.mobile ?? '',
          ownerCity: company?.city ?? '',
          ownerMunicipality: (company as any)?.municipality ?? '',
          ownerSummary: company?.name ?? '',
        };
        setEditingVehicle({ id });
        setInitialFormValues(init);
        setIsModalOpen(true);
      } catch (err: any) {
        const msg = err?.response?.data?.message || e?.response?.data?.message || 'Error desconocido';
        alert(`No se pudo cargar el detalle del vehículo para editar: ${msg}`);
        console.error('Fallback tambien falló:', err?.response?.data || err);
      }
    }
  };

  // Close download menu on outside click or ESC
  useEffect(() => {
    if (openDownloadMenuId == null) return;
    const onClick = (e: any) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-download-menu="true"]')) {
        setOpenDownloadMenuId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDownloadMenuId(null);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [openDownloadMenuId]);

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
  
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`http://localhost:3002/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo? Esta acción no se puede deshacer.")) return;
    try {
      await deleteVehicleMutation.mutateAsync(id);
    } catch (e) {
      alert("No se pudo eliminar el vehículo. Verifique que no tenga inspecciones, accidentes o pólizas asociadas.");
    }
  };

  const vehiclesCount = metrics?.vehicles ?? undefined;
  const items = vehicles ?? [];
  return (
    <ListShell
      title="Flota de vehículos"
      subtitle="Control de hojas de vida, pólizas y mantenimientos."
      actions={
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
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
          <KPICard title="Vehículos" value={vehiclesCount !== undefined ? String(vehiclesCount) : "-"} />
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
                    <div className="relative flex items-center gap-2">
                      {/* Edit icon */}
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100"
                        title="Editar"
                        onClick={() => openEditModal(v.id)}
                        aria-label="Editar vehículo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-700">
                          <path d="M15.586 3.586a2 2 0 0 1 2.828 2.828l-9.193 9.193a4 4 0 0 1-1.414.94l-3.042 1.141a.5.5 0 0 1-.65-.65l1.14-3.042a4 4 0 0 1 .94-1.414l9.193-9.193Z" />
                          <path d="M12.379 6.793 13.793 8.207 5.5 16.5H4.086v-1.414l8.293-8.293Z" />
                        </svg>
                      </button>
                      {/* Download icon with format menu */}
                      <div className="relative" data-download-menu="true">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100"
                          title="Descargar"
                          onClick={() => setOpenDownloadMenuId((prev) => (prev === v.id ? null : v.id))}
                          aria-haspopup="menu"
                          aria-expanded={openDownloadMenuId === v.id}
                          data-download-menu="true"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-700">
                            <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1Z" />
                            <path d="M4 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a1 1 0 1 0-2 0v2H6v-2a1 1 0 1 0-2 0v2Z" />
                          </svg>
                        </button>
                        {openDownloadMenuId === v.id && (
                          <div className="absolute z-50 mt-1 w-36 rounded-md border border-gray-200 bg-white shadow-lg right-0" data-download-menu="true">
                            <button
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                              onClick={() => { handleExportVehicle(v.id, 'html'); setOpenDownloadMenuId(null); }}
                            >
                              HTML
                            </button>
                            <button
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                              onClick={() => { handleExportVehicle(v.id, 'pdf'); setOpenDownloadMenuId(null); }}
                            >
                              PDF
                            </button>
                            <button
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                              onClick={() => { handleExportVehicle(v.id, 'excel'); setOpenDownloadMenuId(null); }}
                            >
                              Excel
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Delete icon */}
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100"
                        title="Eliminar"
                        onClick={() => handleDeleteVehicle(v.id)}
                        aria-label="Eliminar vehículo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-red-600">
                          <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm2 3h2V5h-2v1ZM8 7h10v12H8V7Zm3 3a1 1 0 1 1 2 0v7a1 1 0 1 1-2 0v-7Zm-3 0a1 1 0 1 1 2 0v7a1 1 0 1 1-2 0v-7Zm8 0a1 1 0 1 1 2 0v7a1 1 0 1 1-2 0v-7Z" />
                        </svg>
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
      
      {/* Modal para agregar/editar vehículo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingVehicle(null); setInitialFormValues(null); }}
        title={`${editingVehicle ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'} - GO-FO-01`}
        size="xl"
      >
        <VehicleForm
          onSubmit={editingVehicle ? handleEditVehicle : handleCreateVehicle}
          onCancel={() => { setIsModalOpen(false); setEditingVehicle(null); setInitialFormValues(null); }}
          isLoading={createVehicleMutation.isPending || updateVehicleMutation.isPending}
          initialValues={initialFormValues}
        />
      </Modal>
    </ListShell>
  );
}
