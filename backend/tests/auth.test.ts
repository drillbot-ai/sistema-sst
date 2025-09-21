import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/main';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth endpoints', () => {
  beforeEach(async () => {
    // Limpia usuarios antes de cada prueba
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a new user and logs in', async () => {
    const email = 'test@example.com';
    const password = 'secret123';
    // Registro
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, role: 'DRIVER' });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeDefined();
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.email).toBe(email);
  });
});