import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import fastUri from 'fast-uri';

interface PatchedFloor {
  readonly packageName: string;
  readonly minimum: string;
}

const PATCHED_FLOORS: readonly PatchedFloor[] = [
  { packageName: '@hono/node-server', minimum: '2.0.5' },
  { packageName: '@modelcontextprotocol/sdk', minimum: '1.32.1' },
  { packageName: 'body-parser', minimum: '2.3.0' },
  { packageName: 'brace-expansion', minimum: '5.0.9' },
  { packageName: 'fast-uri', minimum: '3.1.9' },
  { packageName: 'hono', minimum: '4.13.11' },
  { packageName: 'ip-address', minimum: '10.7.1' },
  { packageName: 'proxy-addr', minimum: '2.0.8' },
  { packageName: 'qs', minimum: '6.16.0' },
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

  it('keeps workspace installs on patched runtime dependency lines', () => {
    const manifest = readJsonObject(resolve(process.cwd(), 'package.json'));
    for (const [name, floor] of Object.entries({
      hono: '^4.13.11', 'ip-address': '^10.7.1', 'proxy-addr': '^2.0.8', qs: '^6.16.0',
    })) expect(readStringProperty(manifest.overrides, name)).toBe(floor);
    const mcp = readJsonObject(resolve(process.cwd(), 'packages/bijou-mcp/package.json'));
    expect(readStringProperty(mcp.dependencies, '@modelcontextprotocol/sdk')).toBe('^1.32.1');
  });

  it('keeps clean workspace installs on the patched fast-uri line', () => {
    const manifest = readJsonObject(resolve(process.cwd(), 'package.json'));
    expect(readStringProperty(manifest.overrides, 'fast-uri')).toBe('^3.1.9');
  });

  it('normalizes encoded uppercase hostname octets before comparing hosts', () => {
    expect(fastUri.parse('//%41.com').host).toBe('a.com');
    expect(fastUri.equal('//%41.com', '//a.com')).toBe(true);
  });

  it.each(['%68ttp://a/', '%u0068ttp://a/'])('rejects an encoded scheme in %s', (source) => {
    const parsed = fastUri.parse(source);
    expect(parsed.error).toEqual(expect.any(String));
    expect(parsed.scheme).not.toBe('http');
    expect(fastUri.equal(source, 'http://a/')).toBe(false);
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
