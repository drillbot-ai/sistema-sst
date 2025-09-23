"use client";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Metrics {
  accidents: number;
  inspections: number;
  capacitaciones: number;
  polizas: number;
  vehicles: number;
  accidentFrequency: number;
}

export default function MetricsPage() {
  const { data, isLoading, error } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await axios.get<Metrics>('http://localhost:3002/api/metrics');
      return res.data;
    },
  });
  return (
    <main className="container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Indicadores Clave</h1>
      {isLoading && <p>Cargando indicadores…</p>}
  {!!error && <p className="text-red-500">Error al cargar indicadores</p>}
      {data && (
        <ul className="space-y-2">
          <li className="bg-white shadow rounded p-4 flex justify-between">
            <span>Accidentes registrados</span>
            <span className="font-bold">{data.accidents}</span>
          </li>
          <li className="bg-white shadow rounded p-4 flex justify-between">
            <span>Inspecciones realizadas</span>
            <span className="font-bold">{data.inspections}</span>
          </li>
          <li className="bg-white shadow rounded p-4 flex justify-between">
            <span>Capacitaciones</span>
            <span className="font-bold">{data.capacitaciones}</span>
          </li>
          <li className="bg-white shadow rounded p-4 flex justify-between">
            <span>Pólizas</span>
            <span className="font-bold">{data.polizas}</span>
          </li>
          <li className="bg-white shadow rounded p-4 flex justify-between">
            <span>Vehículos</span>
            <span className="font-bold">{data.vehicles}</span>
          </li>
          <li className="bg-white shadow rounded p-4 flex justify-between">
            <span>Frecuencia de accidentes (accidentes/vehículo)</span>
            <span className="font-bold">{data.accidentFrequency.toFixed(2)}</span>
          </li>
        </ul>
      )}
    </main>
  );
}
