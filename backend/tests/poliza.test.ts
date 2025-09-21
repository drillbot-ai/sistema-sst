import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Poliza endpoints', () => {
  beforeEach(async () => {
    // Limpia tablas relacionadas antes de cada prueba
    await prisma.poliza.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a poliza as supervisor', async () => {
    // Crear un usuario supervisor y obtener token
    const email = 'supervisor@example.com';
    const password = 'secret123';
    await request(app)
      .post('/api/auth/register')
      .send({ email, password, role: 'SUPERVISOR' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    const token = loginRes.body.token;
    // Crear vehículo
    const vehicle = await prisma.vehicle.create({ data: { plate: 'XYZ123' } });
    // Crear póliza
    const polizaData = {
      type: 'SOAT',
      number: 'POL12345',
      issueDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      vehicleId: vehicle.id,
    };
    const res = await request(app)
      .post('/api/polizas')
      .set('Authorization', `Bearer ${token}`)
      .send(polizaData);
    expect(res.status).toBe(201);
    expect(res.body.number).toBe(polizaData.number);
  });
});