import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';

export const ROOT = resolve(import.meta.dirname, '../../..');
const MAX_LINES = 150;
const MAX_BYTES = 12_000;

export function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

export function debtScript(): string | undefined {
  const parsed: unknown = JSON.parse(read('package.json'));
  if (
    parsed == null
    || typeof parsed !== 'object'
    || !('scripts' in parsed)
    || parsed.scripts == null
    || typeof parsed.scripts !== 'object'
  ) {
    throw new Error('package.json scripts must be an object');
  }
  if (!('code-dojo:debt' in parsed.scripts)) return undefined;
  const command = parsed.scripts['code-dojo:debt'];
  return typeof command === 'string' ? command : undefined;
}

export function expectFamilyFilesWithinBounds(
  roots: readonly string[],
  families: Readonly<Record<string, readonly string[]>>,
): void {
  for (const entrypoint of roots) {
    const family = families[entrypoint] ?? [];
    expect(family.length, entrypoint).toBeGreaterThan(1);
    expect(family[0], entrypoint).toBe(entrypoint);
    for (const relativePath of family) {
      const file = resolve(ROOT, relativePath);
      expect(existsSync(file), relativePath).toBe(true);
      const source = readFileSync(file, 'utf8');
      const lines = source.split(/\r?\n/u).length;
      const bytes = Buffer.byteLength(source, 'utf8');
      expect(
        lines <= MAX_LINES && bytes <= MAX_BYTES,
        `${relativePath} is ${String(lines)} lines / ${String(bytes)} bytes`,
      ).toBe(true);
    }
  }
}
