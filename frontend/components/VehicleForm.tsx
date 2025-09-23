"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";

interface VehicleFormData {
  // 1. INFORMACION DEL VEHICULO
  serialNumber: string;           // No. SERIE
  brand: string;                  // Marca
  manufacturingYear: number | null; // Año de fabricación
  registrationDate: string;       // Fecha de levante -> Fecha de registro
  model: string;                  // Modelo
  color: string;                  // Color
  motorNumber: string;            // No. Motor
  fuel: string;                   // Combustible
  line: string;                   // Línea
  series: string;                 // Serie
  vehicleClass: string;           // Clase de vehículo
  customsManifest: string;        // Manifiesto de aduana
  registrationCard: string;       // Tarjeta de registro
  mileage: string;               // Rodaje
  
  // Placa (requerida)
  plate: string;
  
  // 2. INFORMACION DEL PROPIETARIO
  ownerCompany: string;          // Empresa
  ownerNit: string;              // NIT
  ownerAddress: string;          // Dirección
  ownerNeighborhood: string;     // Barrio
  ownerPhone: string;            // Teléfono
  ownerMobile: string;           // Celular
  ownerCity: string;             // Ciudad
  ownerMunicipality: string;     // Municipio
  
  // 3. DATOS DE ACTUALIZACION
  updatedBy: Array<{
    fullName: string;            // NOMBRES Y APELLIDOS
    position: string;            // CARGO
    date: string;                // Fecha de actualización
  }>;
  
  // Foto del vehículo
  vehiclePhoto: string;          // URL de la foto
  
  // Documentos y pólizas (existente)
  documents: Array<{
    type: string;
    number: string;
    issuer: string;
    issueDate: string;
    expireDate: string;
  }>;
  
  // Historial de mantenimiento (existente)
  maintenanceHistory: Array<{
    date: string;
    type: string;
    description: string;
    cost: number | null;
  }>;
}

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const documentTypes = [
  "SOAT",
  "RTM", 
  "Contractual",
  "Extracontractual",
  "Hidrocarburos",
  "PE",
  "Tecnomecánica",
  "Otro"
];

const maintenanceTypes = ["Preventivo", "Correctivo"];

export default function VehicleForm({ onSubmit, onCancel, isLoading = false }: VehicleFormProps) {
  const [activeTab, setActiveTab] = useState("identification");
  
  const { register, control, handleSubmit, formState: { errors } } = useForm<VehicleFormData>({
    defaultValues: {
      // 1. INFORMACION DEL VEHICULO
      serialNumber: "",
      brand: "",
      manufacturingYear: null,
      registrationDate: "",
      model: "",
      color: "",
      motorNumber: "",
      fuel: "",
      line: "",
      series: "",
      vehicleClass: "",
      customsManifest: "",
      registrationCard: "",
      mileage: "",
      plate: "",
      
      // 2. INFORMACION DEL PROPIETARIO
      ownerCompany: "",
      ownerNit: "",
      ownerAddress: "",
      ownerNeighborhood: "",
      ownerPhone: "",
      ownerMobile: "",
      ownerCity: "",
      ownerMunicipality: "",
      
      // 3. DATOS DE ACTUALIZACION
      updatedBy: [],
      
      // Foto del vehículo
      vehiclePhoto: "",
      
      // Documentos y pólizas
      documents: [],
      
      // Historial de mantenimiento
      maintenanceHistory: []
    }
  });

  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control,
    name: "documents"
  });

  const { fields: maintenanceFields, append: appendMaintenance, remove: removeMaintenance } = useFieldArray({
    control,
    name: "maintenanceHistory"
  });

  const tabs = [
    { id: "vehicle", label: "Información del Vehículo", icon: "🚗" },
    { id: "owner", label: "Información del Propietario", icon: "�" },
    { id: "documents", label: "Documentos y Pólizas", icon: "📄" },
    { id: "maintenance", label: "Historial de Mantenimiento", icon: "🔧" },
    { id: "updates", label: "Datos de Actualización", icon: "📝" }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Identificación */}
        {activeTab === "identification" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa *
                </label>
                <input
                  {...register("plate", { required: "La placa es obligatoria" })}
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.plate ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="ABC123"
                />
                {errors.plate && (
                  <p className="mt-1 text-sm text-red-600">{errors.plate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial/NIV
                </label>
                <input
                  {...register("serial")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  {...register("brand")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toyota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  {...register("model")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hilux"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año
                </label>
                <input
                  {...register("year", { 
                    valueAsNumber: true,
                    min: { value: 1900, message: "Año inválido" },
                    max: { value: new Date().getFullYear() + 1, message: "Año inválido" }
                  })}
                  type="number"
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.year ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="2023"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documentos y Pólizas */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Documentos y Pólizas</h3>
              <button
                type="button"
                onClick={() => appendDocument({
                  type: "",
                  number: "",
                  issuer: "",
                  issueDate: "",
                  expireDate: ""
                })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Agregar Documento
              </button>
            </div>

            {documentFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay documentos agregados. Haz clic en "Agregar Documento" para comenzar.
              </div>
            )}

            {documentFields.map((field: any, index: number) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Documento {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      {...register(`documents.${index}.type`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {documentTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <input
                      {...register(`documents.${index}.number`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aseguradora/Entidad
                    </label>
                    <input
                      {...register(`documents.${index}.issuer`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Expedición
                    </label>
                    <input
                      {...register(`documents.${index}.issueDate`)}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      {...register(`documents.${index}.expireDate`)}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historial de Mantenimiento */}
        {activeTab === "maintenance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Historial de Mantenimiento</h3>
              <button
                type="button"
                onClick={() => appendMaintenance({
                  date: "",
                  type: "",
                  description: "",
                  cost: null
                })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Agregar Mantenimiento
              </button>
            </div>

            {maintenanceFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay registros de mantenimiento. Haz clic en "Agregar Mantenimiento" para comenzar.
              </div>
            )}

            {maintenanceFields.map((field: any, index: number) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Mantenimiento {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeMaintenance(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      {...register(`maintenanceHistory.${index}.date`)}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      {...register(`maintenanceHistory.${index}.type`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {maintenanceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      {...register(`maintenanceHistory.${index}.description`)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción del mantenimiento realizado..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo
                    </label>
                    <input
                      {...register(`maintenanceHistory.${index}.cost`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar Vehículo"}
        </button>
      </div>
    </form>
  );
}