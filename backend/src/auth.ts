import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SECRET = process.env.JWT_SECRET || 'change_this_secret_in_env';
const TOKEN_TTL = process.env.JWT_TTL ? parseInt(process.env.JWT_TTL) : 60 * 60 * 4; // 4h

// Default refresh token TTL (in seconds). One week by default.
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TTL
  ? parseInt(process.env.JWT_REFRESH_TTL)
  : 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { id: number; role: UserRole; email: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

/**
 * Generate a secure random string for use as a refresh token. Stores the token in the
 * database along with its expiry. Returns the token value (in plain text) to send back to
 * the client. The caller is responsible for persisting the token in a cookie or
 * local storage on the client side.
 */
export async function generateRefreshToken(userId: number): Promise<{ token: string; expiresAt: Date }> {
  // Generate 32 random bytes and encode as hex for the token value
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

/**
 * Rotate an existing refresh token. Looks up the provided token in the database,
 * verifies that it hasn't expired, deletes it and creates a new refresh token record.
 * Returns the new refresh token and its expiry. If the provided token is invalid or
 * expired, returns null.
 */
export async function rotateRefreshToken(token: string): Promise<{ token: string; expiresAt: Date; user: { id: number; role: UserRole; email: string } } | null> {
  const existing = await prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
  if (!existing) return null;
  // Check expiration
  if (existing.expiresAt < new Date()) {
    // Remove expired token
    await prisma.refreshToken.delete({ where: { id: existing.id } });
    return null;
  }
  // Delete the old token to prevent reuse (token rotation)
  await prisma.refreshToken.delete({ where: { id: existing.id } });
  // Create a new refresh token for the same user
  const { token: newToken, expiresAt } = await generateRefreshToken(existing.userId);
  const userPayload = { id: existing.user.id, role: existing.user.role, email: existing.user.email };
  return { token: newToken, expiresAt, user: userPayload };
}

/**
 * Revoke a refresh token by deleting it from the database. Returns true if a record
 * was deleted, false otherwise.
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const deleted = await prisma.refreshToken.delete({ where: { token } });
    return !!deleted;
  } catch {
    return false;
  }
}

interface AuthRequest extends Request {
  user?: { id: number; role: UserRole; email: string };
}

// Middleware to authenticate using a bearer token. Optionally checks for required roles.
export function authenticate(requiredRoles: UserRole[] = []) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, SECRET) as JwtPayload & { id: number; role: UserRole; email: string };
      req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
      // Check roles
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token', error: err });
    }
  };
}

// Create a user; used in register endpoint
export async function createUser(email: string, password: string, role: UserRole = 'DRIVER', name?: string) {
  const hashed = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      password: hashed,
      role,
      name,
    },
  });
}

// Authenticate user credentials; returns user if valid
export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await comparePassword(password, user.password);
  return valid ? user : null;
}