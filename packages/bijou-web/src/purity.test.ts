import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = join(import.meta.dirname, '..');
const sourceFiles = readdirSync(import.meta.dirname, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts') && !/\.test(?:-support)?\.ts$/u.test(file))
  .sort();

const forbidden = [
  { name: 'node: import', pattern: /["']node:/u },
  { name: 'Node built-in import', pattern: /from\s+["'](?:fs|path|os|crypto|process|buffer|util|stream|tty|readline)(?:\/[^"']*)?["']/u },
  { name: 'process global', pattern: /\bprocess\b/u },
  { name: 'Buffer global', pattern: /\bBuffer\b/u },
  { name: 'require call', pattern: /\brequire\s*\(/u },
];

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

describe('@flyingrobots/bijou-web host purity', () => {
  it('ships source files to scan', () => {
    expect(sourceFiles).toContain('index.ts');
    expect(sourceFiles.length).toBeGreaterThan(4);
  });

  it.each(sourceFiles)('%s uses no Node.js import, process, or Buffer', (file) => {
    const lines = readFileSync(join(import.meta.dirname, file), 'utf8').split(/\r?\n/u);
    const findings = lines.flatMap((line, index) => forbidden
      .filter((rule) => rule.pattern.test(line))
      .map((rule) => `${file}:${String(index + 1)} ${rule.name}: ${line.trim()}`));
    expect(findings).toEqual([]);
  });

  it('declares zero runtime dependencies and no Node.js typings', () => {
    const manifest: unknown = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    const config: unknown = JSON.parse(readFileSync(join(packageRoot, 'tsconfig.json'), 'utf8'));
    if (!isStringRecord(manifest) || !isStringRecord(config) || !isStringRecord(config['compilerOptions'])) {
      throw new Error('package.json or tsconfig.json is not an object');
    }
    expect(manifest['dependencies']).toBeUndefined();
    expect(manifest['license']).toBe('Apache-2.0');
    expect(manifest['devDependencies']).toEqual({ typescript: '^5.9.3' });
    expect(config['compilerOptions']['types']).toEqual([]);
  });
});
