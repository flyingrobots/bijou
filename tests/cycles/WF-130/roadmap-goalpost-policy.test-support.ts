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

export function sectionBetween(
  source: string,
  startHeading: string,
  endHeading: string,
): string {
  const start = source.indexOf(startHeading);
  if (start === -1) throw new Error(`Missing start heading ${startHeading}`);
  const end = source.indexOf(endHeading, start + startHeading.length);
  if (end === -1) throw new Error(`Missing end heading ${endHeading}`);
  return source.slice(start, end);
}

export function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Expected JSON object');
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function extractBashCommandBlocks(markdown: string): string[] {
  return Array.from(
    markdown.matchAll(/```bash\n(?<command>[\s\S]*?)```/g),
    (match) => match.groups?.command.trim() ?? '',
  );
}

export function extractReferencedTestPaths(markdown: string): string[] {
  const paths = Array.from(
    markdown.matchAll(
      /\b((?:packages|scripts|tests)\/[A-Za-z0-9._/-]+\.test\.ts)\b/g,
    ),
    (match) => match[1],
  );
  return [...new Set(paths)].sort();
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
