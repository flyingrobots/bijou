import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The showcase consumes Geordi only through tarballs vendored at one pinned commit.
// These cases recompute every digest the pin records, so a replaced file fails here.
const root = new URL('../../', import.meta.url);
const example = new URL('examples/web-gpu/', root);

interface PinnedPackage { readonly name: string; readonly version: string; readonly tarball: string; readonly sha256: string }
interface PinnedFile { readonly path: string; readonly source: string; readonly sha256: string }
interface GeordiPin {
  readonly schema: string;
  readonly repository: string;
  readonly commit: string;
  readonly packages: readonly PinnedPackage[];
  readonly files: readonly PinnedFile[];
}
interface LockEntry { readonly version?: string; readonly resolved?: string; readonly integrity?: string }

function json<T>(url: URL): T {
  return JSON.parse(readFileSync(url, 'utf8')) as T;
}
function digest(path: string, algorithm: 'sha256' | 'sha512', encoding: 'hex' | 'base64'): string {
  return createHash(algorithm).update(readFileSync(new URL(path, example))).digest(encoding);
}

const pin = json<GeordiPin>(new URL('geordi-pin.json', example));
const manifest = json<{ readonly devDependencies: Record<string, string> }>(new URL('package.json', root));
const lock = json<{ readonly packages: Record<string, LockEntry> }>(new URL('package-lock.json', root));

describe('examples/web-gpu Geordi pin', () => {
  it('names one full Geordi commit', () => {
    expect(pin.schema).toBe('bijou.web-gpu.geordi-pin/1');
    expect(pin.repository).toBe('flyingrobots/geordi');
    expect(pin.commit).toMatch(/^[0-9a-f]{40}$/u);
  });

  it('pins both packed packages, core and bijou-gpu', () => {
    expect(pin.packages.map((entry) => entry.name)).toEqual(['@flyingrobots/geordi-core', '@flyingrobots/geordi-bijou-gpu']);
  });

  it.each(pin.packages.map((entry) => [entry.name, entry] as const))('%s tarball matches its recorded SHA-256', (_name, entry) => {
    expect(digest(entry.tarball, 'sha256', 'hex')).toBe(entry.sha256);
  });

  it.each(pin.files.map((entry) => [entry.path, entry] as const))('%s matches its recorded SHA-256', (_path, entry) => {
    expect(digest(entry.path, 'sha256', 'hex')).toBe(entry.sha256);
  });

  it.each(pin.packages.map((entry) => [entry.name, entry] as const))('%s resolves from the vendored tarball with npm integrity', (name, entry) => {
    const spec = `file:examples/web-gpu/${entry.tarball}`;
    expect(manifest.devDependencies[name]).toBe(spec);
    const locked = lock.packages[`node_modules/${name}`];
    expect(locked?.version).toBe(entry.version);
    expect(locked?.resolved).toBe(spec);
    expect(locked?.integrity).toBe(`sha512-${digest(entry.tarball, 'sha512', 'base64')}`);
  });
});
