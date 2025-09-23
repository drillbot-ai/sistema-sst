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
import path from 'path';
import fs from 'fs';
import { ensureUploadsDir, uploadsDir, saveDataUrl, localPathFromUrl } from './storage';
import { loadTheme, saveTheme, listPresets, savePreset, applyPreset as applyThemePreset, deletePreset as deleteThemePreset, resetTheme, exportPreset, importPreset } from './settings';
// Import the forms router for dynamic form operations
import formsRouter from './forms';

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors());
// Accept larger payloads to allow base64 images/files
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
// Static serving for local uploads
ensureUploadsDir();
app.use('/uploads', express.static(uploadsDir));

// Swagger documentation
// setupSwagger(app);

// Mount forms router at /api for dynamic form operations
app.use('/api', formsRouter);

// Simple health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'SST API is running' });
});

/* Settings: Theme */
app.get('/api/settings/theme', (_req: Request, res: Response) => {
  try {
    const theme = loadTheme();
    res.json(theme);
  } catch (err) {
    res.status(500).json({ message: 'Error loading theme settings', error: err });
  }
});

app.put('/api/settings/theme', (req: Request, res: Response) => {
  try {
    const theme = saveTheme(req.body || {});
    res.json(theme);
  } catch (err) {
    res.status(500).json({ message: 'Error saving theme settings', error: err });
  }
});

// Theme presets management
app.get('/api/settings/theme/presets', (_req: Request, res: Response) => {
  try {
    res.json({ presets: listPresets() });
  } catch (err) {
    res.status(500).json({ message: 'Error listing presets', error: err });
  }
});

app.post('/api/settings/theme/presets', (req: Request, res: Response) => {
  try {
    const { name, preset } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ message: 'name is required' });
    const bundle = savePreset(name, preset);
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ message: 'Error saving preset', error: err });
  }
});

app.post('/api/settings/theme/presets/:name/apply', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const applied = applyThemePreset(name);
    if (!applied) return res.status(404).json({ message: 'Preset not found' });
    res.json(applied);
  } catch (err) {
    res.status(500).json({ message: 'Error applying preset', error: err });
  }
});

app.delete('/api/settings/theme/presets/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const bundle = deleteThemePreset(name);
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting preset', error: err });
  }
});

app.post('/api/settings/theme/reset', (_req: Request, res: Response) => {
  try {
    const bundle = resetTheme();
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ message: 'Error resetting theme', error: err });
  }
});

// Export a preset as JSON
app.get('/api/settings/theme/presets/:name/export', (req: Request, res: Response) => {
  try {
    const preset = exportPreset(req.params.name);
    if (!preset) return res.status(404).json({ message: 'Preset not found' });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.name}.json"`);
    res.send(JSON.stringify(preset, null, 2));
  } catch (err) {
    res.status(500).json({ message: 'Error exporting preset', error: err });
  }
});

// Import a preset from JSON
app.post('/api/settings/theme/presets/import', (req: Request, res: Response) => {
  try {
    const { name, preset } = req.body || {};
    if (!name || typeof name !== 'string' || !preset) return res.status(400).json({ message: 'name and preset are required' });
    const bundle = importPreset(name, preset);
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ message: 'Error importing preset', error: err });
  }
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

/* Company Endpoints */
app.get('/api/company', async (_req: Request, res: Response) => {
  try {
  const company = await (prisma as any).company.findFirst({
      where: { defaultCompany: true }
    });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching company', error: err });
  }
});

app.post('/api/company', async (req: Request, res: Response) => {
  try {
    // Si es la empresa por defecto, desactivar las otras
    if (req.body.defaultCompany) {
  await (prisma as any).company.updateMany({
        where: { defaultCompany: true },
        data: { defaultCompany: false }
      });
    }
    
  const company = await (prisma as any).company.create({ data: req.body });
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ message: 'Invalid company data', error: err });
  }
});

app.put('/api/company/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Si es la empresa por defecto, desactivar las otras
    if (req.body.defaultCompany) {
  await (prisma as any).company.updateMany({
        where: { defaultCompany: true, id: { not: id } },
        data: { defaultCompany: false }
      });
    }
    
  const company = await (prisma as any).company.update({
      where: { id },
      data: req.body
    });
    res.json(company);
  } catch (err) {
    res.status(400).json({ message: 'Invalid company data', error: err });
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
    const { plate, serial, brand, model, year, documents, maintenanceHistory, vehiclePhoto, ...vehicleData } = req.body;
    
    // Crear el vehículo principal
    const vehicle = await prisma.vehicle.create({ 
      data: { 
        plate, 
        brand, 
        model, 
        year,
        vin: serial, // Mapear serial a VIN
        ...vehicleData 
      } 
    });

    // Si hay documentos, crear pólizas relacionadas y subir adjuntos si vienen
    let documentsWithUrls: any[] = [];
    if (Array.isArray(documents) && documents.length > 0) {
      const polizasData: any[] = [];
      for (const doc of documents) {
        let fileUrl: string | undefined;
        let fileKey: string | undefined;
        if (doc.fileData && typeof doc.fileData === 'string') {
          try {
            const saved = await saveDataUrl(doc.fileData, `vehicles/${plate}/documents`, doc.fileName || `${doc.type}_${doc.number}`);
            fileUrl = saved.url;
            fileKey = saved.key;
          } catch (e) {
            console.warn('Failed to save document file', e);
          }
        }
        polizasData.push({
          type: doc.type,
          number: doc.number,
          provider: doc.issuer,
          issueDate: doc.issueDate ? new Date(doc.issueDate) : new Date(),
          expiryDate: doc.expireDate ? new Date(doc.expireDate) : new Date(),
          vehicleId: vehicle.id,
          fileKey,
          fileUrl,
        });
        documentsWithUrls.push({ ...doc, fileUrl });
      }
      if (polizasData.length > 0) {
        await prisma.poliza.createMany({ data: polizasData });
      }
    }

    // Crear submission del formulario GO-FO-01
    try {
      const goForm = await prisma.form.findUnique({
        where: { code: 'GO-FO-01' },
        include: { versions: { where: { active: true } } }
      });

      if (goForm && goForm.versions.length > 0) {
        // Subir foto del vehículo si viene en base64
        let vehiclePhotoUrl: string | undefined = undefined;
        if (vehiclePhoto && typeof vehiclePhoto === 'string' && vehiclePhoto.startsWith('data:')) {
          try {
            const saved = await saveDataUrl(vehiclePhoto, `vehicles/${plate}/photos`, 'vehicle_photo');
            vehiclePhotoUrl = saved.url;
          } catch (e) {
            console.warn('Failed to save vehicle photo', e);
          }
        }

        // Guardar fotos de mantenimientos si vienen
        let maintenanceWithPhotos: any[] = [];
        if (Array.isArray(maintenanceHistory)) {
          for (const m of maintenanceHistory) {
            let photoUrls: string[] = [];
            if (Array.isArray(m.photos)) {
              for (let i = 0; i < m.photos.length; i++) {
                const p = m.photos[i];
                if (p && typeof p === 'string' && p.startsWith('data:')) {
                  try {
                    const saved = await saveDataUrl(p, `vehicles/${plate}/maintenance`, `m_${m.date || 'na'}_${i + 1}`);
                    photoUrls.push(saved.url);
                  } catch (e) {
                    console.warn('Failed to save maintenance photo', e);
                  }
                }
              }
            }
            maintenanceWithPhotos.push({ ...m, photos: photoUrls });
          }
        }

        await prisma.submission.create({
          data: {
            formVersionId: goForm.versions[0].id,
            vehicleId: vehicle.id,
            status: 'SUBMITTED',
            data: {
              identification: { plate, serial, brand, model, year },
              vehiclePhoto: vehiclePhotoUrl,
              documents: documentsWithUrls.length > 0 ? documentsWithUrls : (documents || []),
              maintenanceHistory: maintenanceWithPhotos.length > 0 ? maintenanceWithPhotos : (maintenanceHistory || []),
            }
          }
        });
      }
    } catch (formError) {
      console.warn('Warning: Could not create form submission for GO-FO-01:', formError);
    }

    res.status(201).json(vehicle);
  } catch (err) {
    console.error('Error creating vehicle:', err);
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

/* Vehicle Export Endpoints */
app.get('/api/vehicles/:id/export/html', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ 
      where: { id },
      include: { polizas: true }
    });
    
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    // Obtener información de la empresa
  const company = await (prisma as any).company.findFirst({ where: { defaultCompany: true } });
    
    // Obtener submission del GO-FO-01
    const goForm = await prisma.form.findUnique({
      where: { code: 'GO-FO-01' },
      include: { 
        versions: { 
          where: { active: true },
          include: {
            submissions: {
              where: { vehicleId: id },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });
    
    const submission = goForm?.versions[0]?.submissions[0];
    
    // Generar HTML del formulario GO-FO-01
    const htmlContent = generateVehicleFormHTML(vehicle, company, submission);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=GO-FO-01_${vehicle.plate}.html`);
    res.send(htmlContent);
  } catch (err) {
    res.status(500).json({ message: 'Error generating HTML', error: err });
  }
});

app.get('/api/vehicles/:id/export/pdf', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ 
      where: { id },
      include: { polizas: true }
    });
    
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    // Obtener información de la empresa
  const company = await (prisma as any).company.findFirst({ where: { defaultCompany: true } });
    
    // Obtener submission del GO-FO-01
    const goForm = await prisma.form.findUnique({
      where: { code: 'GO-FO-01' },
      include: { 
        versions: { 
          where: { active: true },
          include: {
            submissions: {
              where: { vehicleId: id },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });
    
    const submission = goForm?.versions[0]?.submissions[0];
    
    // Crear PDF del formulario GO-FO-01
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=GO-FO-01_${vehicle.plate}.pdf`);
    doc.pipe(res);
    
    // Generar contenido del PDF
    generateVehicleFormPDF(doc, vehicle, company, submission);
    
    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error generating PDF', error: err });
  }
});

// Función auxiliar para generar HTML del formulario
function generateVehicleFormHTML(vehicle: any, company: any, submission: any) {
  const data = submission?.data || {};
  const companyInfo = company || {};
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GO-FO-01 - ${vehicle.plate}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border: 2px solid #000; padding: 10px; margin-bottom: 20px; }
        .company-info { background: #f0b90b; padding: 10px; text-align: center; font-weight: bold; }
        .form-info { text-align: right; padding: 10px; }
        .section { margin: 20px 0; border: 1px solid #000; }
        .section-title { background: #e0e0e0; padding: 10px; font-weight: bold; text-align: center; }
        .field-row { display: flex; margin: 5px 0; }
        .field { flex: 1; padding: 5px; border-right: 1px solid #ccc; }
        .field:last-child { border-right: none; }
        .field-label { font-weight: bold; margin-right: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; }
        .photo-placeholder { width: 200px; height: 150px; border: 2px dashed #ccc; margin: 20px auto; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <!-- Logo placeholder -->
                <div style="width: 80px; height: 80px; border: 1px solid #000; display: flex; align-items: center; justify-content: center;">
                    LOGO
                </div>
            </div>
            <div style="flex: 2; text-align: center;">
                <h2>HOJA DE VIDA DE MAQUINARIA AMARILLA</h2>
            </div>
            <div style="flex: 1; text-align: right; font-size: 12px;">
                <div>CÓDIGO: GO-FO-01</div>
                <div>VERSIÓN: 01</div>
                <div>APROBADO: 15-11-2023</div>
                <div>PÁGINA: 1 DE 1</div>
            </div>
        </div>
        <div class="company-info">
            ${companyInfo.name || 'EMPRESA'} ${companyInfo.nit ? `NIT: ${companyInfo.nit}` : ''}
        </div>
    </div>

    ${data.vehiclePhoto ? `
    <div style="text-align:center; margin: 10px 0;">
      <img src="${data.vehiclePhoto}" alt="Foto vehículo" style="max-width: 200px; max-height: 150px; object-fit: cover; border: 1px solid #999;" />
    </div>` : `
    <div class="photo-placeholder">FOTO VEHÍCULO</div>
    `}

    <div class="section">
        <div class="section-title">1. INFORMACIÓN DEL VEHÍCULO</div>
        <table>
            <tr>
                <td><strong>No. SERIE:</strong> ${data.identification?.serialNumber || vehicle.vin || ''}</td>
                <td><strong>Marca:</strong> ${data.identification?.brand || vehicle.brand || ''}</td>
                <td><strong>Año de fabricación:</strong> ${data.identification?.year || vehicle.year || ''}</td>
            </tr>
            <tr>
                <td><strong>Fecha de registro:</strong> ${data.identification?.registrationDate || ''}</td>
                <td><strong>Modelo:</strong> ${data.identification?.model || vehicle.model || ''}</td>
                <td><strong>Color:</strong> ${data.identification?.color || ''}</td>
            </tr>
            <tr>
                <td><strong>No. Motor:</strong> ${data.identification?.motorNumber || ''}</td>
                <td><strong>Combustible:</strong> ${data.identification?.fuel || ''}</td>
                <td><strong>Línea:</strong> ${data.identification?.line || ''}</td>
            </tr>
            <tr>
                <td><strong>Serie:</strong> ${data.identification?.series || ''}</td>
                <td><strong>Clase de vehículo:</strong> ${data.identification?.vehicleClass || ''}</td>
                <td><strong>Manifiesto de aduana:</strong> ${data.identification?.customsManifest || ''}</td>
            </tr>
            <tr>
                <td><strong>Tarjeta de registro:</strong> ${data.identification?.registrationCard || ''}</td>
                <td><strong>Rodaje:</strong> ${data.identification?.mileage || ''}</td>
                <td><strong>Placa:</strong> ${vehicle.plate}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. INFORMACIÓN DEL PROPIETARIO</div>
        <table>
            <tr>
                <td><strong>Empresa:</strong> ${data.owner?.ownerCompany || companyInfo.name || ''}</td>
                <td><strong>NIT:</strong> ${data.owner?.ownerNit || companyInfo.nit || ''}</td>
            </tr>
            <tr>
                <td><strong>Dirección:</strong> ${data.owner?.ownerAddress || companyInfo.address || ''}</td>
                <td><strong>Barrio:</strong> ${data.owner?.ownerNeighborhood || companyInfo.neighborhood || ''}</td>
            </tr>
            <tr>
                <td><strong>Teléfono:</strong> ${data.owner?.ownerPhone || companyInfo.phone || ''}</td>
                <td><strong>Celular:</strong> ${data.owner?.ownerMobile || companyInfo.mobile || ''}</td>
            </tr>
            <tr>
                <td><strong>Ciudad:</strong> ${data.owner?.ownerCity || companyInfo.city || ''}</td>
                <td><strong>Municipio:</strong> ${data.owner?.ownerMunicipality || ''}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. DATOS DE ACTUALIZACIÓN</div>
        <table>
            <tr>
                <th>NOMBRES Y APELLIDOS</th>
                <th>CARGO</th>
                <th>FECHA</th>
            </tr>
            ${(data.updatedBy || []).map((person: any) => `
            <tr>
                <td>${person.fullName || ''}</td>
                <td>${person.position || ''}</td>
                <td>${person.date || ''}</td>
            </tr>
            `).join('')}
        </table>
    </div>

  ${data.documents && data.documents.length > 0 ? `
    <div class="section">
        <div class="section-title">DOCUMENTOS Y PÓLIZAS</div>
        <table>
            <tr>
        <th>Tipo</th>
        <th>Número</th>
        <th>Aseguradora/Entidad</th>
        <th>Expedición</th>
        <th>Vencimiento</th>
        <th>Archivo</th>
            </tr>
            ${data.documents.map((doc: any) => `
            <tr>
                <td>${doc.type || ''}</td>
                <td>${doc.number || ''}</td>
                <td>${doc.issuer || ''}</td>
                <td>${doc.issueDate || ''}</td>
        <td>${doc.expireDate || ''}</td>
        <td>${doc.fileUrl ? `<a href="${doc.fileUrl}" target="_blank">Ver</a>` : ''}</td>
            </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

  ${data.maintenanceHistory && data.maintenanceHistory.length > 0 ? `
    <div class="section">
        <div class="section-title">HISTORIAL DE MANTENIMIENTO</div>
    <div style="display:flex; flex-wrap: wrap; gap: 8px; margin: 8px 0;">
      ${data.maintenanceHistory.flatMap((m: any) => (m.photos || [])).map((u: string) => `<img src="${u}" style="width:100px;height:75px;object-fit:cover;border:1px solid #ccc;" />`).join('')}
    </div>
        <table>
            <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Costo</th>
            </tr>
            ${data.maintenanceHistory.map((maintenance: any) => `
            <tr>
                <td>${maintenance.date || ''}</td>
                <td>${maintenance.type || ''}</td>
                <td>${maintenance.description || ''}</td>
                <td>${maintenance.cost ? `$${maintenance.cost}` : ''}</td>
            </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        Documento generado automáticamente por el Sistema SG-SST<br>
        Fecha de generación: ${new Date().toLocaleDateString('es-CO')}
    </div>
</body>
</html>
  `;
}

// Función auxiliar para generar PDF del formulario
function generateVehicleFormPDF(doc: any, vehicle: any, company: any, submission: any) {
  const data = submission?.data || {};
  const companyInfo = company || {};
  
  // Header
  doc.fontSize(16).text('HOJA DE VIDA DE MAQUINARIA AMARILLA', { align: 'center' });
  doc.fontSize(12).text(`CÓDIGO: GO-FO-01 | VERSIÓN: 01 | APROBADO: 15-11-2023`, { align: 'center' });
  doc.moveDown();
  
  if (companyInfo.name) {
    doc.fontSize(14).text(`${companyInfo.name}${companyInfo.nit ? ` NIT: ${companyInfo.nit}` : ''}`, { align: 'center' });
    doc.moveDown();
  }
  
  // Foto del vehículo (si existe y es local), de lo contrario placeholder
  const photoUrl: string | undefined = data.vehiclePhoto;
  let drewPhoto = false;
  if (photoUrl) {
    const local = localPathFromUrl(photoUrl);
    if (local && fs.existsSync(local)) {
      try {
        const x = (doc.page.width - 140) / 2;
        const y = doc.y;
        doc.image(local, x, y, { fit: [140, 100], align: 'center' }).rect(x, y, 140, 100).stroke();
        doc.moveDown(6);
        drewPhoto = true;
      } catch {}
    }
  }
  if (!drewPhoto) {
    doc.fontSize(12).text('FOTO VEHÍCULO', { align: 'center' });
    doc.rect(250, doc.y, 100, 80).stroke();
    doc.moveDown(6);
  }
  
  // 1. Información del vehículo
  doc.fontSize(14).text('1. INFORMACIÓN DEL VEHÍCULO', { underline: true });
  doc.moveDown();
  
  const vehicleInfo = [
    [`No. SERIE: ${data.identification?.serialNumber || vehicle.vin || ''}`, `Marca: ${data.identification?.brand || vehicle.brand || ''}`, `Año: ${data.identification?.year || vehicle.year || ''}`],
    [`Fecha registro: ${data.identification?.registrationDate || ''}`, `Modelo: ${data.identification?.model || vehicle.model || ''}`, `Color: ${data.identification?.color || ''}`],
    [`No. Motor: ${data.identification?.motorNumber || ''}`, `Combustible: ${data.identification?.fuel || ''}`, `Línea: ${data.identification?.line || ''}`],
    [`Serie: ${data.identification?.series || ''}`, `Clase: ${data.identification?.vehicleClass || ''}`, `Placa: ${vehicle.plate}`]
  ];
  
  vehicleInfo.forEach(row => {
    row.forEach((field, index) => {
      doc.text(field, 50 + (index * 170), doc.y - 15, { width: 160 });
    });
    doc.moveDown();
  });
  
  doc.moveDown();
  
  // 2. Información del propietario
  doc.fontSize(14).text('2. INFORMACIÓN DEL PROPIETARIO', { underline: true });
  doc.moveDown();
  
  const ownerInfo = [
    [`Empresa: ${data.owner?.ownerCompany || companyInfo.name || ''}`, `NIT: ${data.owner?.ownerNit || companyInfo.nit || ''}`],
    [`Dirección: ${data.owner?.ownerAddress || companyInfo.address || ''}`, `Barrio: ${data.owner?.ownerNeighborhood || companyInfo.neighborhood || ''}`],
    [`Teléfono: ${data.owner?.ownerPhone || companyInfo.phone || ''}`, `Celular: ${data.owner?.ownerMobile || companyInfo.mobile || ''}`],
    [`Ciudad: ${data.owner?.ownerCity || companyInfo.city || ''}`, `Municipio: ${data.owner?.ownerMunicipality || ''}`]
  ];
  
  ownerInfo.forEach(row => {
    row.forEach((field, index) => {
      doc.text(field, 50 + (index * 270), doc.y - 15, { width: 260 });
    });
    doc.moveDown();
  });
  
  doc.moveDown();
  
  // 3. Datos de actualización
  doc.fontSize(14).text('3. DATOS DE ACTUALIZACIÓN', { underline: true });
  doc.moveDown();
  
  if (data.updatedBy && data.updatedBy.length > 0) {
    data.updatedBy.forEach((person: any) => {
      doc.text(`${person.fullName || ''} - ${person.position || ''} - ${person.date || ''}`);
    });
  }
  
  // Documentos y pólizas (si existen)
  if (Array.isArray(data.documents) && data.documents.length > 0) {
    doc.moveDown();
    doc.fontSize(14).text('DOCUMENTOS Y PÓLIZAS', { underline: true });
    doc.moveDown(0.5);
    data.documents.forEach((d: any) => {
      doc.fontSize(10).text(`• ${d.type || ''} ${d.number || ''} – ${d.issuer || ''} (${d.issueDate || ''} → ${d.expireDate || ''}) ${d.fileUrl ? '[archivo adjunto]' : ''}`);
    });
  }

  // Fotos de mantenimiento si existen
  if (Array.isArray(data.maintenanceHistory) && data.maintenanceHistory.length > 0) {
    const photos: string[] = data.maintenanceHistory.flatMap((m: any) => Array.isArray(m.photos) ? m.photos : []);
    if (photos.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text('FOTOS DE MANTENIMIENTO', { underline: true });
      doc.moveDown(0.5);
      const startX = doc.x;
      let x = startX;
      let y = doc.y;
      const boxW = 90;
      const boxH = 65;
      const gap = 8;
      const maxX = doc.page.width - doc.page.margins.right - boxW;
      photos.forEach((u: string) => {
        const local = localPathFromUrl(u);
        if (local && fs.existsSync(local)) {
          try {
            doc.image(local, x, y, { fit: [boxW, boxH], align: 'left' }).rect(x, y, boxW, boxH).stroke();
            x += boxW + gap;
            if (x > maxX) {
              x = startX;
              y += boxH + gap;
            }
          } catch {}
        }
      });
      doc.moveDown(2);
    }
  }

  doc.moveDown(2);
  doc.fontSize(10).text(`Documento generado automáticamente - ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
}

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

// Company endpoints
app.get('/api/companies', async (req: Request, res: Response) => {
  try {
  const companies = await (prisma as any).company.findMany();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

app.get('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
  const company = await (prisma as any).company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Error fetching company' });
  }
});

app.post('/api/companies', async (req: Request, res: Response) => {
  try {
  const company = await (prisma as any).company.create({
      data: req.body
    });
    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Error creating company' });
  }
});

app.put('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
  const company = await (prisma as any).company.update({
      where: { id },
      data: req.body
    });
    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Error updating company' });
  }
});

app.delete('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
  await (prisma as any).company.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Error deleting company' });
  }
});

// Start server
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`SST backend listening on port ${port}`);
});

// Exportar la instancia de la aplicación para pruebas con Supertest.
export default app;