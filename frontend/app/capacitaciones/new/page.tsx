"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function NewCapacitacionPage() {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      alert('Título y fecha son obligatorios');
      return;
    }
    try {
      // parse participants into JSON array
      const parts = participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const payload = {
        title,
        topic: topic || undefined,
        date,
        participants: parts.length > 0 ? parts : undefined,
      };
      await axios.post('http://localhost:3002/api/capacitaciones', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      router.push('/capacitaciones');
    } catch (err: any) {
      alert(
        err.response?.data?.message || 'Error al crear la capacitación. Puede que no tengas permisos.',
      );
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Nueva capacitación</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-md p-4 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Título *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Tema</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Fecha *</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Participantes (separados por comas)</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="p1,p2,p3"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar
        </button>
      </form>
    </main>
  );
}
