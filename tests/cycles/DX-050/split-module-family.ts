import { readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitModuleFamily(entrypoint: string): readonly string[] {
  const directory = dirname(entrypoint);
  const stem = basename(entrypoint).replace(/\.tsx?$/u, '');
  const pattern = new RegExp(
    `^${escapeRegExp(stem)}(?:\\.part\\d+|-[^.]+)?\\.tsx?$`,
    'u',
  );
  return readdirSync(directory)
    .filter((name) => pattern.test(name))
    .map((name) => resolve(directory, name));
}
