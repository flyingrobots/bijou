import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TSX_MINIMUM_VERSION = '4.22.4';

describe('toolchain deprecation guards', () => {
  it('keeps tsx on a version that uses module.registerHooks when Node supports it', () => {
    const workspacePackage = readJsonObject('package.json');
    const installedPackage = readJsonObject('node_modules/tsx/package.json');
    const devDependencies = stringRecordValue(workspacePackage['devDependencies']);
    const installedVersion = requiredString(installedPackage['version'], 'node_modules/tsx version');
    const requestedVersion = minimumVersion(devDependencies?.['tsx'] ?? '');

    expect(compareVersions(requestedVersion, TSX_MINIMUM_VERSION)).toBeGreaterThanOrEqual(0);
    expect(compareVersions(installedVersion, TSX_MINIMUM_VERSION)).toBeGreaterThanOrEqual(0);
  });

  it('loads TypeScript through the tsx ESM loader without runtime deprecations', () => {
    const output = execFileSync(
      process.execPath,
      [
        '--throw-deprecation',
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        "console.log('tsx loader ok')",
      ],
      { cwd: ROOT, encoding: 'utf8' },
    );

    expect(output.trim()).toBe('tsx loader ok');
  });

  it('runs the tsx CLI without runtime deprecations', () => {
    const output = execFileSync(
      process.execPath,
      [resolve(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--version'],
      {
        cwd: ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_OPTIONS: withThrowDeprecation(process.env.NODE_OPTIONS),
        },
      },
    );

    expect(output).toContain('tsx v');
  });
});

function readJsonObject(path: string): Readonly<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${path} must contain a JSON object`);
  }
  return Object.freeze(Object.fromEntries(Object.entries(parsed)));
}

function stringRecordValue(value: unknown): Readonly<Record<string, string>> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') return undefined;
    record[key] = entry;
  }
  return Object.freeze(record);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  return value;
}

function compareVersions(left: string, right: string): number {
  const leftParts = numericVersionParts(left);
  const rightParts = numericVersionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function numericVersionParts(version: string): readonly number[] {
  return version
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function minimumVersion(range: string): string {
  return range.replace(/^[^\d]*/, '');
}

function withThrowDeprecation(nodeOptions: string | undefined): string {
  return [nodeOptions, '--throw-deprecation'].filter((option) => option != null && option !== '').join(' ');
}
