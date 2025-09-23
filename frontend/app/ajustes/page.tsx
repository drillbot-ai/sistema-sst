"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import ListShell from "../../components/ListShell";

interface CompanyData {
  // Información básica
  name: string;              // Razón social
  nit: string;               // NIT con dígito de verificación
  businessName?: string;     // Nombre comercial
  legalType?: string;        // Tipo de sociedad
  
  // Contacto principal
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  
  // Dirección principal
  address?: string;
  neighborhood?: string;     // Barrio
  city?: string;
  department?: string;       // Departamento
  country: string;
  postalCode?: string;
  
  // Información legal
  chamber?: string;          // Cámara de comercio
  registrationNumber?: string; // Número de matrícula mercantil
  registrationDate?: string;
  economicActivity?: string; // Actividad económica principal (CIIU)
  
  // Información tributaria
  taxRegime?: string;        // Régimen tributario
  retainerAgent: boolean;    // Agente retenedor
  selfRetainer: boolean;     // Autorretenedor
  vatResponsible: boolean;   // Responsable de IVA
  
  // Información laboral
  employeeCount?: number;    // Número de empleados
  arl?: string;              // ARL
  eps?: string;              // EPS
  pensionFund?: string;      // Fondo de pensiones
  compensationFund?: string; // Caja de compensación
  
  // SG-SST
  sstPolicy?: string;        // Política de SG-SST
  sstObjectives?: string;    // Objetivos del SG-SST
  sstManager?: string;       // Responsable del SG-SST
  sstManagerEmail?: string;
  sstManagerPhone?: string;
  
  // Logo y documentos
  logoUrl?: string;
  
  // Configuración del sistema
  isActive: boolean;
  defaultCompany: boolean;   // Empresa por defecto
}

const legalTypes = [
  "S.A.S.", "LTDA.", "S.A.", "E.U.", "Persona Natural", "Fundación", "Cooperativa", "Otro"
];

const departments = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá",
  "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare",
  "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo",
  "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada"
];

const taxRegimes = [
  "Responsable de IVA", "No responsable de IVA", "Gran Contribuyente", "Autorretenedor",
  "Régimen Simple de Tributación", "No residente"
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const queryClient = useQueryClient();

  // Obtener datos de la empresa
  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:3002/api/company`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyData>({
    defaultValues: {
      name: "",
      nit: "",
      businessName: "",
      legalType: "",
      phone: "",
      mobile: "",
      email: "",
      website: "",
      address: "",
      neighborhood: "",
      city: "",
      department: "",
      country: "Colombia",
      postalCode: "",
      chamber: "",
      registrationNumber: "",
      registrationDate: "",
      economicActivity: "",
      taxRegime: "",
      retainerAgent: false,
      selfRetainer: false,
      vatResponsible: false,
      employeeCount: 0,
      arl: "",
      eps: "",
      pensionFund: "",
      compensationFund: "",
      sstPolicy: "",
      sstObjectives: "",
      sstManager: "",
      sstManagerEmail: "",
      sstManagerPhone: "",
      logoUrl: "",
      isActive: true,
      defaultCompany: true
    }
  });

  // Llenar formulario cuando se cargan los datos
  useEffect(() => {
    if (company) {
      reset(company);
    }
  }, [company, reset]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyData) => {
      if (company?.id) {
        const response = await axios.put(`http://localhost:3002/api/company/${company.id}`, data);
        return response.data;
      } else {
        const response = await axios.post(`http://localhost:3002/api/company`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      alert("Información de empresa guardada exitosamente");
    },
    onError: (error) => {
      console.error("Error al guardar:", error);
      alert("Error al guardar la información de la empresa");
    }
  });

  const onSubmit = async (data: CompanyData) => {
    await updateCompanyMutation.mutateAsync(data);
  };

  const tabs = [
    { id: "basic", label: "Información Básica", icon: "🏢" },
    { id: "contact", label: "Contacto y Ubicación", icon: "📞" },
    { id: "legal", label: "Información Legal", icon: "⚖️" },
    { id: "labor", label: "Información Laboral", icon: "👥" },
    { id: "sst", label: "SG-SST", icon: "🛡️" }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <ListShell
      title="Configuración de Empresa"
      subtitle="Gestiona la información completa de tu empresa para el sistema SG-SST"
    >
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
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
            {/* Información Básica */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Información Básica de la Empresa</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social *
                    </label>
                    <input
                      {...register("name", { required: "La razón social es obligatoria" })}
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="EMPRESA EJEMPLO S.A.S."
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIT *
                    </label>
                    <input
                      {...register("nit", { required: "El NIT es obligatorio" })}
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nit ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="901234567-8"
                    />
                    {errors.nit && (
                      <p className="mt-1 text-sm text-red-600">{errors.nit.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Comercial
                    </label>
                    <input
                      {...register("businessName")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre comercial"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Sociedad
                    </label>
                    <select
                      {...register("legalType")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {legalTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actividad Económica (CIIU)
                    </label>
                    <input
                      {...register("economicActivity")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Código CIIU y descripción"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Empleados
                    </label>
                    <input
                      {...register("employeeCount", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contacto y Ubicación */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Contacto y Ubicación</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      {...register("phone")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(01) 234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      {...register("mobile")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="310 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contacto@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sitio Web
                    </label>
                    <input
                      {...register("website")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.empresa.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      {...register("address")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Calle 123 # 45-67"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barrio
                    </label>
                    <input
                      {...register("neighborhood")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del barrio"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      {...register("city")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Bogotá"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <select
                      {...register("department")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {departments.map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      {...register("postalCode")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="110111"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Información Legal */}
            {activeTab === "legal" && (
              <div className="space-y-6">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900">Información Legal y Tributaria</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cámara de Comercio
                    </label>
                    <input
                      {...register("chamber")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cámara de Comercio de Bogotá"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Matrícula Mercantil
                    </label>
                    <input
                      {...register("registrationNumber")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Número de matrícula"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Registro
                    </label>
                    <input
                      {...register("registrationDate")}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Régimen Tributario
                    </label>
                    <select
                      {...register("taxRegime")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {taxRegimes.map((regime) => (
                        <option key={regime} value={regime}>{regime}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Características Tributarias
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            {...register("retainerAgent")}
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Agente Retenedor</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            {...register("selfRetainer")}
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Autorretenedor</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            {...register("vatResponsible")}
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Responsable de IVA</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información Laboral */}
            {activeTab === "labor" && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900">Información Laboral</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ARL
                    </label>
                    <input
                      {...register("arl")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Administradora de Riesgos Laborales"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EPS
                    </label>
                    <input
                      {...register("eps")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Entidad Promotora de Salud"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fondo de Pensiones
                    </label>
                    <input
                      {...register("pensionFund")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Administradora de Fondo de Pensiones"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caja de Compensación
                    </label>
                    <input
                      {...register("compensationFund")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Caja de Compensación Familiar"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SG-SST */}
            {activeTab === "sst" && (
              <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900">Sistema de Gestión de Seguridad y Salud en el Trabajo</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Política de SG-SST
                    </label>
                    <textarea
                      {...register("sstPolicy")}
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción de la política de SG-SST de la empresa..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Objetivos del SG-SST
                    </label>
                    <textarea
                      {...register("sstObjectives")}
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Objetivos específicos del Sistema de Gestión de SST..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsable del SG-SST
                      </label>
                      <input
                        {...register("sstManager")}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email del Responsable
                      </label>
                      <input
                        {...register("sstManagerEmail")}
                        type="email"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="responsable@empresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono del Responsable
                      </label>
                      <input
                        {...register("sstManagerPhone")}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="310 123 4567"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={updateCompanyMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updateCompanyMutation.isPending ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </form>
      </div>
    </ListShell>
  );
}
