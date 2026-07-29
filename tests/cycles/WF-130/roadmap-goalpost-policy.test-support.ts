import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

export const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
);

export function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

export function normalized(relativePath: string): string {
  return read(relativePath).replace(/\s+/g, ' ').trim();
}

export function expectClaims(source: string, claims: readonly string[]): void {
  for (const claim of claims) expect(source).toContain(claim);
}

export function expectNoClaims(
  source: string,
  claims: readonly string[],
): void {
  for (const claim of claims) expect(source).not.toContain(claim);
}

export function expectOrderedClaims(
  source: string,
  claims: readonly string[],
): void {
  let previousIndex = -1;
  for (const claim of claims) {
    const index = source.indexOf(claim);
    expect(index, claim).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}
