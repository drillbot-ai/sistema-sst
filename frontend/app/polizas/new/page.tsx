"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Vehicle {
  id: number;
  plate: string;
}

export default function NewPolizaPage() {
  const [type, setType] = useState('');
  const [number, setNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [value, setValue] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    // load vehicles for dropdown
    async function loadVehicles() {
      try {
        const res = await axios.get<Vehicle[]>(
          'http://localhost:3002/api/vehicles?limit=100&offset=0',
        );
        setVehicles(res.data);
      } catch {
        // ignore errors
      }
    }
    loadVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !type || !issueDate || !expiryDate || !vehicleId) {
      alert('Complete todos los campos requeridos');
      return;
    }
    try {
      const payload = {
        type,
        number,
        provider: provider || undefined,
        issueDate,
        expiryDate,
        value: value ? parseFloat(value) : undefined,
        vehicleId: parseInt(vehicleId),
      };
      await axios.post('http://localhost:3002/api/polizas', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      router.push('/polizas');
    } catch (err: any) {
      alert(
        err.response?.data?.message || 'Error al crear la póliza. Puede que no tengas permisos.',
      );
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Nueva póliza</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-md p-4 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Número *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Tipo *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Proveedor</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Fecha de expedición *</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Fecha de vencimiento *</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Valor</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Vehículo *</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Seleccione un vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar
        </button>
      </form>
    </main>
  );
}
