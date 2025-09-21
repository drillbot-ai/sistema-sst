"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function NewContractorPage() {
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nit) {
      alert('Nombre y NIT son obligatorios');
      return;
    }
    try {
      const payload = {
        name,
        nit,
        contact: contact || undefined,
        phone: phone || undefined,
        email: email || undefined,
      };
      await axios.post('http://localhost:3001/api/contractors', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      router.push('/contratistas');
    } catch (err: any) {
      alert(
        err.response?.data?.message || 'Error al crear el contratista. Puede que no tengas permisos.',
      );
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Nuevo contratista</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-md p-4 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nombre *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">NIT *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={nit}
            onChange={(e) => setNit(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Contacto</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Teléfono</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar
        </button>
      </form>
    </main>
  );
}