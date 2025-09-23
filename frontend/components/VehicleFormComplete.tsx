"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";

interface VehicleFormData {
  // 1. INFORMACION DEL VEHICULO
  serialNumber: string;           // No. SERIE
  brand: string;                  // Marca
  manufacturingYear: number | null; // Año de fabricación
  registrationDate: string;       // Fecha de registro
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
  plate: string;                 // Placa (requerida)
  // Campos adicionales solicitados
  registrationNumber: string;     // No. de Registro
  propertyCard: string;           // Tarjeta de Propiedad (número)
  allRiskPolicy: string;          // Póliza todo riesgo (número)
  grumasCertificate: string;      // Certificación de Grumas (número)
  machineType: string;            // Tipo de máquina
  ownerSummary: string;           // Propietario (resumen en cabecera)
  ownerDocument: string;          // Documento del propietario
  
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
  
  // Documentos y pólizas
  documents: Array<{
    type: string;
    number: string;
    issuer: string;
    issueDate: string;
    expireDate: string;
    // Archivo adjunto opcional
    fileName?: string;
    fileType?: string;
    fileData?: string; // base64
  }>;
  
  // Historial de mantenimiento
  maintenanceHistory: Array<{
    date: string;
    type: string;
    description: string;
    cost: number | null;
    // Fotos opcionales del mantenimiento
    photos?: string[]; // base64 array
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

const fuelTypes = ["Gasolina", "Diesel", "Gas", "Eléctrico", "Híbrido"];
const vehicleClasses = ["Automóvil", "Camioneta", "Camión", "Motocicleta", "Maquinaria", "Retroexcavadora", "Otro"];

export default function VehicleForm({ onSubmit, onCancel, isLoading = false }: VehicleFormProps) {
  const [activeTab, setActiveTab] = useState("vehicle");
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<VehicleFormData>({
    defaultValues: {
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
      registrationNumber: "",
      propertyCard: "",
      allRiskPolicy: "",
      grumasCertificate: "",
      machineType: "",
      ownerSummary: "",
      ownerDocument: "",
      ownerCompany: "",
      ownerNit: "",
      ownerAddress: "",
      ownerNeighborhood: "",
      ownerPhone: "",
      ownerMobile: "",
      ownerCity: "",
      ownerMunicipality: "",
      updatedBy: [],
      vehiclePhoto: "",
      documents: [],
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

  const { fields: updatesFields, append: appendUpdate, remove: removeUpdate } = useFieldArray({
    control,
    name: "updatedBy"
  });

  // Función para manejar la subida de fotos
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. El tamaño máximo es 5MB.');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      // Convertir a base64 para preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setValue("vehiclePhoto", result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir archivo por documento
  const handleDocumentFileChange = (index: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('El archivo es muy grande (máx. 10MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result as string;
      setValue(`documents.${index}.fileName`, file.name);
      setValue(`documents.${index}.fileType`, file.type);
      setValue(`documents.${index}.fileData`, fileData);
    };
    reader.readAsDataURL(file);
  };

  const removeDocumentFile = (index: number) => {
    setValue(`documents.${index}.fileName`, undefined);
    setValue(`documents.${index}.fileType`, undefined);
    setValue(`documents.${index}.fileData`, undefined);
  };

  // Subir fotos por mantenimiento (múltiples)
  const handleMaintenancePhotosChange = (index: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const maxPhotos = 6;
    const promises = Array.from(files).slice(0, maxPhotos).map(f => new Promise<string>((resolve, reject) => {
      if (!f.type.startsWith('image/')) return reject('Archivo no es imagen');
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject('Error leyendo archivo');
      r.readAsDataURL(f);
    }));
    try {
      const imgs = await Promise.all(promises);
      const current = watch(`maintenanceHistory.${index}.photos`) || [];
      setValue(`maintenanceHistory.${index}.photos`, [...current, ...imgs].slice(0, maxPhotos));
    } catch (e) {
      console.error(e);
      alert('Error al cargar imágenes');
    }
  };

  const removeMaintenancePhoto = (index: number, photoIdx: number) => {
    const current = watch(`maintenanceHistory.${index}.photos`) || [];
    const next = current.filter((_: string, i: number) => i !== photoIdx);
    setValue(`maintenanceHistory.${index}.photos`, next);
  };

  const tabs = [
    { id: "vehicle", label: "Información del Vehículo", icon: "🚗" },
    { id: "owner", label: "Información del Propietario", icon: "👤" },
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
        {/* 1. INFORMACIÓN DEL VEHÍCULO */}
        {activeTab === "vehicle" && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">1. INFORMACIÓN DEL VEHÍCULO</h3>
            </div>
            
            {/* Foto del vehículo */}
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto del Vehículo
                </label>
                <div className="w-48 h-36 mx-auto bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {watch("vehiclePhoto") ? (
                    <div className="relative w-full h-full">
                      <img
                        src={watch("vehiclePhoto")}
                        alt="Foto del vehículo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setValue("vehiclePhoto", "")}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                      <span className="text-gray-500 mb-2">📷</span>
                      <span className="text-sm text-gray-500">Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formato: JPG, PNG (máx. 5MB)
                </p>
              </div>
            </div>
            {/* Campos en el orden solicitado */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  {...register("brand")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Chevrolet"
                />
              </div>
              {/* No. de Registro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. de Registro
                </label>
                <input
                  {...register("registrationNumber")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="REG-0001"
                />
              </div>
              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  {...register("model")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="N300"
                />
              </div>
              {/* No. Motor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Motor
                </label>
                <input
                  {...register("motorNumber")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC123456"
                />
              </div>
              {/* Línea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Línea
                </label>
                <input
                  {...register("line")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Carga"
                />
              </div>
              {/* Clase de vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clase de vehículo
                </label>
                <select
                  {...register("vehicleClass")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {vehicleClasses.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {/* Tarjeta de registro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarjeta de registro
                </label>
                <input
                  {...register("registrationCard")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TR-123456"
                />
              </div>
              {/* Tarjeta de Propiedad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarjeta de Propiedad
                </label>
                <input
                  {...register("propertyCard")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TP-987654"
                />
              </div>

              {/* Póliza todo riesgo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Póliza todo riesgo
                </label>
                <input
                  {...register("allRiskPolicy")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="POL-TR-0001"
                />
              </div>

              {/* Certificación de Grumas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificación de Grumas
                </label>
                <input
                  {...register("grumasCertificate")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GRUMAS-001"
                />
              </div>

              {/* Año de fabricación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año de fabricación
                </label>
                <input
                  {...register("manufacturingYear", { valueAsNumber: true })}
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2023"
                />
              </div>

              {/* Tipo de Máquina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Máquina
                </label>
                <input
                  {...register("machineType")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Retroexcavadora"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  {...register("color")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Blanco"
                />
              </div>

              {/* Combustible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
                <select {...register("fuel")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar...</option>
                  {fuelTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>
              {/* Serie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serie
                </label>
                <input
                  {...register("series")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="S001"
                />
              </div>
              {/* Manifiesto de aduana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manifiesto de aduana
                </label>
                <input
                  {...register("customsManifest")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="M001"
                />
              </div>
              {/* Rodaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rodaje
                </label>
                <input
                  {...register("mileage")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000 km"
                />
              </div>
              {/* Propietario (resumen) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Propietario</label>
                <input
                  {...register("ownerSummary")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transportes XYZ S.A.S."
                />
              </div>

              {/* Documento propietario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                <input
                  {...register("ownerDocument")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="900123456-1"
                />
              </div>

              {/* Placa y Serie (NIV/Serial) al final del bloque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa *
                </label>
                <input
                  {...register("plate", { required: "La placa es obligatoria" })}
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.plate ? "border-red-300" : "border-gray-300"}`}
                  placeholder="ABC123"
                />
                {errors.plate && (<p className="mt-1 text-sm text-red-600">{errors.plate.message}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. SERIE (NIV)
                </label>
                <input
                  {...register("serialNumber")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1HGBH41JXMN109186"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. INFORMACIÓN DEL PROPIETARIO */}
        {activeTab === "owner" && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">2. INFORMACIÓN DEL PROPIETARIO</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  {...register("ownerCompany")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transportes XYZ S.A.S."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIT
                </label>
                <input
                  {...register("ownerNit")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="900123456-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  {...register("ownerAddress")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Calle 123 #45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barrio
                </label>
                <input
                  {...register("ownerNeighborhood")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  {...register("ownerPhone")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3001234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Celular
                </label>
                <input
                  {...register("ownerMobile")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3109876543"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  {...register("ownerCity")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bogotá"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipio
                </label>
                <input
                  {...register("ownerMunicipality")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bogotá D.C."
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. DOCUMENTOS Y PÓLIZAS */}
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

                  {/* Adjuntar archivo del documento */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
                    {watch(`documents.${index}.fileData`) ? (
                      <div className="flex items-center justify-between border rounded p-2">
                        <div className="text-sm text-gray-700 truncate">
                          {watch(`documents.${index}.fileName`) || 'archivo adjunto'}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={watch(`documents.${index}.fileData`) as string}
                            download={watch(`documents.${index}.fileName`) || 'documento'}
                            className="text-blue-600 text-sm"
                          >
                            Descargar
                          </a>
                          <button type="button" onClick={() => removeDocumentFile(index)} className="text-red-600 text-sm">Quitar</button>
                        </div>
                      </div>
                    ) : (
                      <input type="file" accept=".pdf,image/*" onChange={handleDocumentFileChange(index)} className="w-full text-sm" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. HISTORIAL DE MANTENIMIENTO */}
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

                  {/* Fotos del mantenimiento */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos (opcional)</label>
                    <input type="file" accept="image/*" multiple onChange={handleMaintenancePhotosChange(index)} className="w-full text-sm mb-2" />
                    {Array.isArray(watch(`maintenanceHistory.${index}.photos`) || []) && (watch(`maintenanceHistory.${index}.photos`) || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(watch(`maintenanceHistory.${index}.photos`) || []).map((src: string, pIdx: number) => (
                          <div key={pIdx} className="relative w-20 h-20 border rounded overflow-hidden">
                            <img src={src} alt={`foto-${pIdx+1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeMaintenancePhoto(index, pIdx)} className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. DATOS DE ACTUALIZACIÓN */}
        {activeTab === "updates" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Datos de Actualización</h3>
              <button
                type="button"
                onClick={() => appendUpdate({
                  fullName: "",
                  position: "",
                  date: ""
                })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Agregar Actualización
              </button>
            </div>

            {updatesFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay registros de actualización. Haz clic en "Agregar Actualización" para comenzar.
              </div>
            )}

            {updatesFields.map((field: any, index: number) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Actualización {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeUpdate(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres y Apellidos
                    </label>
                    <input
                      {...register(`updatedBy.${index}.fullName`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <input
                      {...register(`updatedBy.${index}.position`)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Supervisor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      {...register(`updatedBy.${index}.date`)}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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