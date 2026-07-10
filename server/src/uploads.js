import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// magic-byte sniffing: never trust the client-provided MIME type
const SIGNATURES = [
  { ext: 'jpg', mime: 'image/jpeg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    ext: 'webp',
    mime: 'image/webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('file');

export function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  return SIGNATURES.find((s) => s.check(buffer)) || null;
}

// Saves a validated image with a random, non-guessable filename and
// returns the public path. The filename is fully server-generated: no
// user input ever reaches the filesystem path.
export async function saveImage(buffer) {
  const type = detectImageType(buffer);
  if (!type) return null;
  const name = `${crypto.randomBytes(16).toString('hex')}.${type.ext}`;
  await fs.mkdir(config.uploadDir, { recursive: true });
  await fs.writeFile(path.join(config.uploadDir, name), buffer, { flag: 'wx' });
  return `/uploads/${name}`;
}

export async function deleteImage(publicPath) {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const name = path.basename(publicPath);
  // basename() strips any traversal; only delete inside the upload dir
  await fs.rm(path.join(config.uploadDir, name), { force: true });
}
