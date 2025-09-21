import { z } from 'zod';

// Enum values must match the Prisma enum definition.
export const userRoleEnum = z.enum(['DRIVER', 'SUPERVISOR', 'MANAGER']);

export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleEnum.optional(),
  name: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const polizaCreateSchema = z.object({
  type: z.string().min(1),
  number: z.string().min(1),
  provider: z.string().optional(),
  issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  value: z.number().optional(),
  vehicleId: z.number().int(),
  fileKey: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const capacitacionCreateSchema = z.object({
  title: z.string().min(1),
  topic: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  participants: z.any().optional(),
});