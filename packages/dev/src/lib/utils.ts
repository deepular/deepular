import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

export const require = createRequire(import.meta.url);

export async function readFileIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

export function requireIfExists<T>(id: string): T | null {
  try {
    return require(id);
  } catch {
    return null;
  }
}
