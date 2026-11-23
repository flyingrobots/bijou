import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The showcase consumes Geordi only through tarballs vendored at one pinned commit.
// These cases recompute every digest the pin records, so a replaced file fails here.
const root = new URL('../../', import.meta.url);
const example = new URL('examples/web-gpu/', root);

type Fields = Readonly<Record<string, unknown>>;

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function fields(value: unknown, label: string): Fields {
  if (!isFields(value)) throw new Error(`${label} is not an object`);
  return value;
}
function text(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} is not a string`);
  return value;
}
function list(value: unknown, label: string): readonly Fields[] {
  if (!Array.isArray(value)) throw new Error(`${label} is not a list`);
  return value.map((entry, index) => fields(entry, `${label}[${String(index)}]`));
}
function json(url: URL): Fields {
  const parsed: unknown = JSON.parse(readFileSync(url, 'utf8'));
  return fields(parsed, url.pathname);
}
function digest(path: string, algorithm: 'sha256' | 'sha512', encoding: 'hex' | 'base64'): string {
  return createHash(algorithm).update(readFileSync(new URL(path, example))).digest(encoding);
}

const pin = json(new URL('geordi-pin.json', example));
const packages = list(pin['packages'], 'packages').map((entry) => ({
  name: text(entry['name'], 'name'),
  version: text(entry['version'], 'version'),
  tarball: text(entry['tarball'], 'tarball'),
  sha256: text(entry['sha256'], 'sha256'),
}));
const devDependencies = fields(json(new URL('package.json', root))['devDependencies'], 'devDependencies');
const locked = fields(json(new URL('package-lock.json', root))['packages'], 'packages');

describe('examples/web-gpu Geordi pin', () => {
  it('names one full Geordi commit', () => {
    expect(pin['schema']).toBe('bijou.web-gpu.geordi-pin/1');
    expect(pin['repository']).toBe('flyingrobots/geordi');
    expect(text(pin['commit'], 'commit')).toMatch(/^[0-9a-f]{40}$/u);
  });

  it('pins both packed packages, core and bijou-gpu', () => {
    expect(packages.map((entry) => entry.name)).toEqual(['@flyingrobots/geordi-core', '@flyingrobots/geordi-bijou-gpu']);
  });

  it.each(packages.map((entry) => [entry.name, entry] as const))('%s tarball matches its recorded SHA-256', (_name, entry) => {
    expect(digest(entry.tarball, 'sha256', 'hex'), `${entry.tarball} is not the tarball geordi-pin.json records`).toBe(entry.sha256);
  });

  it('pins no file besides the two tarballs, and vendors nothing else', () => {
    expect(pin['files']).toBeUndefined();
    const vendored = readdirSync(new URL('vendor/', example)).sort();
    expect(vendored).toEqual(packages.map((entry) => entry.tarball.replace('vendor/', '')).sort());
  });

  it('keeps every pinned file byte-exact on checkout through .gitattributes', () => {
    const paths = packages.map((entry) => entry.tarball).map((path) => `examples/web-gpu/${path}`);
    const output = execFileSync('git', ['check-attr', 'text', '--', ...paths], { cwd: fileURLToPath(root), encoding: 'utf8' });
    expect(output.trim().split('\n')).toEqual(paths.map((path) => `${path}: text: unset`));
  });

  it.each(packages.map((entry) => [entry.name, entry] as const))('%s resolves from the vendored tarball with npm integrity', (name, entry) => {
    const spec = `file:examples/web-gpu/${entry.tarball}`;
    expect(devDependencies[name], `package.json must install ${name} from ${spec}; after a re-pin, update its file: specifier and run npm install --package-lock-only --ignore-scripts`).toBe(spec);
    const lock = fields(locked[`node_modules/${name}`], name);
    expect(lock['version']).toBe(entry.version);
    expect(lock['resolved']).toBe(spec);
    expect(lock['integrity']).toBe(`sha512-${digest(entry.tarball, 'sha512', 'base64')}`);
  });
});
