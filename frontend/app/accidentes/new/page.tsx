"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function NewAccidentPage() {
  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const router = useRouter();
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !description) return alert('Placa y descripción son obligatorias');
    try {
      await axios.post(
        'http://localhost:3001/api/accidents',
        { description, severity, vehicle: { connect: { plate } } },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      router.push('/');
    } catch (err) {
      alert('Error al registrar el accidente');
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Registrar Accidente</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-md p-4">
        <div className="mb-4">
          <label className="block mb-1 font-medium">Placa del vehículo</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Descripción</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Severidad</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="">Seleccione</option>
            <option value="Leve">Leve</option>
            <option value="Moderada">Moderada</option>
            <option value="Grave">Grave</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Registrar
        </button>
      </form>
    </main>
  );
}