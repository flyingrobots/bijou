import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Expected JSON object');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

describe('WF-130 roadmap goalpost policy', () => {
  it('disables Markdown line-length linting for project docs', () => {
      const markdownlintConfig = requireRecord(JSON.parse(read('.markdownlint.json')));

      expect(markdownlintConfig.MD013).toBe(false);
      expect(markdownlintConfig['line-length']).toBe(false);
    });
});
