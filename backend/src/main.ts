import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient, UserRole } from '@prisma/client';
import PDFDocument from 'pdfkit';
import {
  authenticate,
  generateToken,
  createUser,
  authenticateUser,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from './auth';
import { userRegisterSchema, userLoginSchema, polizaCreateSchema, capacitacionCreateSchema } from './zodSchemas';
import { getPresignedUploadUrl } from './s3';
import { z } from 'zod';
import { setupSwagger } from './swagger';
// Import the forms router for dynamic form operations
import formsRouter from './forms';

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Swagger documentation
// setupSwagger(app);

// Mount forms router at /api for dynamic form operations
app.use('/api', formsRouter);

// Simple health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'SST API is running' });
});

/* Auth Endpoints */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const parsed = userRegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const role: UserRole = parsed.role ?? 'DRIVER';
    const user = await createUser(parsed.email, parsed.password, role, parsed.name);
    const accessToken = generateToken({ id: user.id, role: user.role, email: user.email });
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);
    res.status(201).json({
      token: accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    res.status(500).json({ message: 'Error creating user', error: err });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const parsed = userLoginSchema.parse(req.body);
    const user = await authenticateUser(parsed.email, parsed.password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const accessToken = generateToken({ id: user.id, role: user.role, email: user.email });
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);
    res.json({
      token: accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// Endpoint to obtain a new access token using a valid refresh token. This route rotates
// the refresh token (deletes the old one and issues a new one) and returns a new access
// token and refresh token. Clients should update their stored refresh token accordingly.
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });
  try {
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) return res.status(401).json({ message: 'Invalid or expired refresh token' });
    const accessToken = generateToken(rotated.user);
    res.json({ token: accessToken, refreshToken: rotated.token, refreshExpiresAt: rotated.expiresAt });
  } catch (err) {
    res.status(500).json({ message: 'Error rotating refresh token', error: err });
  }
});

// Logout endpoint: revoke a refresh token. The client should also discard its access token.
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });
  try {
    const revoked = await revokeRefreshToken(refreshToken);
    if (!revoked) return res.status(401).json({ message: 'Invalid refresh token' });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Error revoking refresh token', error: err });
  }
});

/* Vehicle Endpoints */
app.get('/api/vehicles', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  const search = req.query.search ? String(req.query.search) : '';
  const where = search
    ? { plate: { contains: search, mode: 'insensitive' as const } }
    : undefined;
  const vehicles = await prisma.vehicle.findMany({ take: limit, skip: offset, where });
  res.json(vehicles);
});

app.get('/api/vehicles/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
});

app.post('/api/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: 'Invalid vehicle data', error: err });
  }
});

/* Driver Endpoints */
app.get('/api/drivers', async (_req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany();
  res.json(drivers);
});

app.post('/api/drivers', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.create({ data: req.body });
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ message: 'Invalid driver data', error: err });
  }
});

/* Inspection Endpoints */
app.get('/api/inspections', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  const search = req.query.search ? String(req.query.search) : '';
  const where = search
    ? {
        OR: [
          { notes: { contains: search, mode: 'insensitive' as const } },
          { vehicle: { plate: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : undefined;
  const inspections = await prisma.inspection.findMany({
    take: limit,
    skip: offset,
    where,
    include: { vehicle: true, driver: true },
  });
  res.json(inspections);
});

// Crea una inspección. Cualquier usuario autenticado (DRIVER, SUPERVISOR, MANAGER) puede crearla.
app.post('/api/inspections', authenticate(), async (req: Request, res: Response) => {
  try {
    const inspection = await prisma.inspection.create({ data: req.body });
    res.status(201).json(inspection);
  } catch (err) {
    res.status(400).json({ message: 'Invalid inspection data', error: err });
  }
});

/* Accident Endpoints */
app.get('/api/accidents', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  const search = req.query.search ? String(req.query.search) : '';
  const where = search
    ? {
        OR: [
          { description: { contains: search, mode: 'insensitive' as const } },
          { vehicle: { plate: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : undefined;
  const accidents = await prisma.accident.findMany({
    take: limit,
    skip: offset,
    where,
    include: { vehicle: true, driver: true },
  });
  res.json(accidents);
});

// Solo usuarios con rol SUPERVISOR o MANAGER pueden registrar accidentes.
app.post('/api/accidents', authenticate(['SUPERVISOR', 'MANAGER']), async (req: Request, res: Response) => {
  try {
    const accident = await prisma.accident.create({ data: req.body });
    res.status(201).json(accident);
  } catch (err) {
    res.status(400).json({ message: 'Invalid accident data', error: err });
  }
});

/* Contractor Endpoints */
app.get('/api/contractors', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  const search = req.query.search ? String(req.query.search) : '';
  const where = search
    ? { OR: [ { name: { contains: search, mode: 'insensitive' as const } }, { nit: { contains: search, mode: 'insensitive' as const } } ] }
    : undefined;
  const contractors = await prisma.contractor.findMany({ take: limit, skip: offset, where });
  res.json(contractors);
});

app.post('/api/contractors', async (req: Request, res: Response) => {
  try {
    const contractor = await prisma.contractor.create({ data: req.body });
    res.status(201).json(contractor);
  } catch (err) {
    res.status(400).json({ message: 'Invalid contractor data', error: err });
  }
});

/* Document Endpoints */
app.get('/api/documents', async (_req: Request, res: Response) => {
  const docs = await prisma.document.findMany();
  res.json(docs);
});

app.post('/api/documents', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.create({ data: req.body });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: 'Invalid document data', error: err });
  }
});

/* Poliza Endpoints */
app.get('/api/polizas', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  const search = req.query.search ? String(req.query.search) : '';
  const where = search
    ? {
        OR: [
          { number: { contains: search, mode: 'insensitive' as const } },
          { vehicle: { plate: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : undefined;
  const polizas = await prisma.poliza.findMany({ take: limit, skip: offset, where, include: { vehicle: true } });
  res.json(polizas);
});

app.post('/api/polizas', authenticate(['SUPERVISOR', 'MANAGER']), async (req: Request, res: Response) => {
  try {
    const parsed = polizaCreateSchema.parse(req.body);
    // Convert date strings to Date objects for Prisma
    const data = {
      type: parsed.type,
      number: parsed.number,
      provider: parsed.provider ?? undefined,
      issueDate: new Date(parsed.issueDate),
      expiryDate: new Date(parsed.expiryDate),
      value: parsed.value,
      vehicleId: parsed.vehicleId,
      fileKey: parsed.fileKey,
      fileUrl: parsed.fileUrl,
    };
    const poliza = await prisma.poliza.create({ data });
    res.status(201).json(poliza);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    res.status(400).json({ message: 'Invalid poliza data', error: err });
  }
});

// Genera una URL prefirmada de S3 para subir un archivo de póliza. Devuelve
// la URL y la clave que deberá guardarse posteriormente en la entidad Poliza.
app.post('/api/polizas/presigned', authenticate(['SUPERVISOR', 'MANAGER']), async (req: Request, res: Response) => {
  const { contentType } = req.body;
  if (!contentType) return res.status(400).json({ message: 'contentType es requerido' });
  try {
    // Crear una clave única usando la fecha y un ID aleatorio
    const key = `polizas/${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const result = await getPresignedUploadUrl(key, contentType);
    res.json({ url: result.url, key: result.key });
  } catch (err) {
    res.status(500).json({ message: 'Error generating presigned URL', error: err });
  }
});

/* Capacitacion Endpoints */
app.get('/api/capacitaciones', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  const search = req.query.search ? String(req.query.search) : '';
  const where = search
    ? { title: { contains: search, mode: 'insensitive' as const } }
    : undefined;
  const caps = await prisma.capacitacion.findMany({ take: limit, skip: offset, where });
  res.json(caps);
});

app.post('/api/capacitaciones', authenticate(['SUPERVISOR', 'MANAGER']), async (req: Request, res: Response) => {
  try {
    const parsed = capacitacionCreateSchema.parse(req.body);
    const data = {
      title: parsed.title,
      topic: parsed.topic ?? undefined,
      date: new Date(parsed.date),
      participants: parsed.participants,
    };
    const cap = await prisma.capacitacion.create({ data });
    res.status(201).json(cap);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    res.status(400).json({ message: 'Invalid capacitacion data', error: err });
  }
});

/* Metrics Endpoint */
app.get('/api/metrics', async (_req: Request, res: Response) => {
  try {
    const [accidentsCount, inspectionsCount, capsCount, polizasCount, vehiclesCount] = await Promise.all([
      prisma.accident.count(),
      prisma.inspection.count(),
      prisma.capacitacion.count(),
      prisma.poliza.count(),
      prisma.vehicle.count(),
    ]);
    // Simple frequency: accidents per vehicle
    const accidentFrequency = vehiclesCount > 0 ? accidentsCount / vehiclesCount : 0;
    res.json({
      accidents: accidentsCount,
      inspections: inspectionsCount,
      capacitaciones: capsCount,
      polizas: polizasCount,
      vehicles: vehiclesCount,
      accidentFrequency,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating metrics', error: err });
  }
});

/* Report Generation */
app.get('/api/reports/accident/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const accident = await prisma.accident.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });
  if (!accident) return res.status(404).json({ message: 'Accident not found' });
  // Create a PDF document
  const doc = new PDFDocument();
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=accident_${id}.pdf`);
  // Pipe PDF to response
  doc.pipe(res);
  // Document content
  doc.fontSize(18).text('Reporte de Accidente', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Fecha: ${accident.date.toISOString()}`);
  doc.text(`Vehículo: ${accident.vehicle.plate} (${accident.vehicle.brand ?? ''} ${accident.vehicle.model ?? ''})`);
  if (accident.driver) {
    doc.text(`Conductor: ${accident.driver.firstName} ${accident.driver.lastName} (Licencia: ${accident.driver.license})`);
  }
  doc.text(`Descripción: ${accident.description}`);
  if (accident.severity) {
    doc.text(`Severidad: ${accident.severity}`);
  }
  doc.end();
});

// Start server
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`SST backend listening on port ${port}`);
});

// Exportar la instancia de la aplicación para pruebas con Supertest.
export default app;