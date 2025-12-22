import fs from 'fs/promises';
import path from 'path';

const CACHE_FILE = process.env.CACHE_FILE || path.resolve('data/conditions-cache.json');

async function ensureDirectory() {
  const dir = path.dirname(CACHE_FILE);
  await fs.mkdir(dir, { recursive: true });
}

export async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`[cache] Failed to read cache: ${error.message}`);
    }
    return null;
  }
}

export async function writeCache(payload) {
  await ensureDirectory();
  await fs.writeFile(CACHE_FILE, JSON.stringify(payload, null, 2));
  return CACHE_FILE;
}

export function cachePath() {
  return CACHE_FILE;
}
