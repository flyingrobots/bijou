import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface PatchedFloor {
  readonly packageName: string;
  readonly minimum: string;
}

const PATCHED_FLOORS: readonly PatchedFloor[] = [
  { packageName: '@hono/node-server', minimum: '2.0.5' },
  { packageName: '@modelcontextprotocol/sdk', minimum: '1.30.0' },
  { packageName: 'body-parser', minimum: '2.3.0' },
  { packageName: 'brace-expansion', minimum: '5.0.9' },
  { packageName: 'fast-uri', minimum: '3.1.5' },
  { packageName: 'hono', minimum: '4.12.34' },
  { packageName: 'ip-address', minimum: '10.3.1' },
  { packageName: 'nanoid', minimum: '3.3.18' },
  { packageName: 'postcss', minimum: '8.5.23' },
];

describe('WF-166 dependency security closeout', () => {
  it('keeps advisory-bearing packages at or above their patched floors', () => {
    const packages = readLockedPackages();
    const violations = PATCHED_FLOORS.flatMap(({ packageName, minimum }) => {
      const rootPath = `node_modules/${packageName}`;
      const entries = Object.entries(packages).filter(
        ([packagePath]) =>
          packagePath === rootPath ||
          packagePath.endsWith(`/node_modules/${packageName}`),
      );
      if (entries.length === 0) {
        return [`${packageName}: missing resolved version`];
      }
      return entries.flatMap(([packagePath, entry]) => {
        if (!isRecord(entry) || typeof entry.version !== 'string') {
          return [`${packagePath}: missing resolved version`];
        }
        return isAtLeast(entry.version, minimum)
          ? []
          : [`${packagePath}: ${entry.version} is below ${minimum}`];
      });
    });

    expect(violations).toEqual([]);
  });

  it('keeps clean installs on the patched Hono line', () => {
    const manifest = readJsonObject(resolve(process.cwd(), 'package.json'));
    expect(readStringProperty(manifest.overrides, 'hono')).toBe('^4.13.0');
  });
});

function readLockedPackages(): Record<string, unknown> {
  const lockfilePath = resolve(process.cwd(), 'package-lock.json');
  const parsed = readJsonObject(lockfilePath);
  if (!isRecord(parsed) || !isRecord(parsed.packages)) {
    throw new Error('package-lock.json must contain a packages object');
  }
  return parsed.packages;
}

function readJsonObject(path: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(parsed)) throw new Error(`${path} must contain a JSON object`);
  return parsed;
}

function readStringProperty(value: unknown, property: string): string | undefined {
  if (!isRecord(value)) return undefined;
  const result = value[property];
  return typeof result === 'string' ? result : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAtLeast(actualRaw: string, minimumRaw: string): boolean {
  const actual = parseTriplet(actualRaw);
  const minimum = parseTriplet(minimumRaw);
  if (actual[0] !== minimum[0]) return actual[0] > minimum[0];
  if (actual[1] !== minimum[1]) return actual[1] > minimum[1];
  return actual[2] >= minimum[2];
}

function parseTriplet(raw: string): readonly [number, number, number] {
  const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/u.exec(raw);
  const { major, minor, patch } = match?.groups ?? {};
  if (major === undefined || minor === undefined || patch === undefined) {
    throw new Error(`Expected a stable semantic version, received ${raw}`);
  }
  return [Number(major), Number(minor), Number(patch)];
}
