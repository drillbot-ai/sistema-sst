import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

// Determine storage mode: if AWS env is configured, prefer S3; otherwise use local disk
const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const s3 = (region && bucket) ? new AWS.S3({ region, signatureVersion: 'v4' }) : null;

// Base uploads directory (for local storage)
export const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

export function ensureUploadsDir() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not ensure uploads directory', e);
  }
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer; extension: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  const extension = mimeToExt(mime);
  return { mime, buffer, extension };
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'image/webp': 'webp',
  };
  return map[mime] || 'bin';
}

function sanitizeName(s: string) {
  return s.replace(/[^a-zA-Z0-9-_\.]/g, '_');
}

function buildS3PublicUrl(key: string) {
  if (!bucket || !region) return '';
  // Generic S3 URL (requires object to be public or presigned when accessed)
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function saveDataUrl(dataUrl: string, keyPrefix: string, baseName?: string): Promise<{ url: string; key: string; mime: string; filename: string; storage: 's3' | 'local' }>
{
  const { mime, buffer, extension } = parseDataUrl(dataUrl);
  const safeBase = sanitizeName(baseName || `file_${Date.now()}`);
  const key = `${keyPrefix.replace(/\/$/, '')}/${safeBase}.${extension}`;

  if (s3 && bucket) {
    await s3.putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: mime }).promise();
    const url = buildS3PublicUrl(key);
    return { url, key, mime, filename: `${safeBase}.${extension}`, storage: 's3' };
  }

  // Local storage
  // Ensure nested directory
  const fullDir = path.join(uploadsDir, keyPrefix);
  fs.mkdirSync(fullDir, { recursive: true });
  const fullPath = path.join(uploadsDir, key);
  fs.writeFileSync(fullPath, buffer);
  // Public URL served by express static as /uploads/
  const url = `/uploads/${key.replace(/\\/g, '/')}`;
  return { url, key, mime, filename: `${safeBase}.${extension}`, storage: 'local' };
}

// If URL points to local uploads (starts with /uploads), resolve absolute file system path
export function localPathFromUrl(url: string): string | null {
  if (!url) return null;
  if (!url.startsWith('/uploads')) return null;
  const relative = url.replace(/^\/uploads\/?/, '');
  return path.join(uploadsDir, relative);
}
