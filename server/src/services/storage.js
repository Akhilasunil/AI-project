import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/ApiError.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(serverRoot, 'uploads'));
}

export async function ensureUploadDir(folder) {
  const dir = path.join(uploadRoot(), folder);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function resolveStorageKey(storageKey) {
  const root = uploadRoot();
  const absolute = path.resolve(root, storageKey);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new ApiError(400, 'Invalid file.');
  }
  return absolute;
}

export async function removeStoredFile(storageKey) {
  if (!storageKey) return;
  try {
    await fs.unlink(resolveStorageKey(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
