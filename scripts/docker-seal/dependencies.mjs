// Audited networked preparation: only package manifests/lock and the lockfile's repository tarballs are present here.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync, openSync, closeSync, fstatSync, readSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
function npmDiagnostic() {
  const directory = '/home/test/.npm/_logs';
  try {
    const latest = readdirSync(directory).filter((name) => name.endsWith('-debug-0.log')).sort().at(-1);
    if (!latest) return;
    const fd = openSync(join(directory, latest), 'r');
    try {
      const size = fstatSync(fd).size;
      const buffer = Buffer.alloc(Math.min(size, 8 * 1024));
      const count = readSync(fd, buffer, 0, buffer.length, Math.max(0, size - buffer.length));
      process.stderr.write(`npm diagnostic tail (${latest}, at most 8 KiB):\n${buffer.subarray(0, count).toString()}\n`);
    } finally { closeSync(fd); }
  } catch (error) { process.stderr.write(`npm diagnostic unavailable: ${error.message}\n`); }
}
function npm(args, cwd = '/work/source') {
  const r = spawnSync('npm', args, { cwd, stdio: 'inherit', timeout: 600_000,
    env: { PATH: process.env.PATH, HOME: '/home/test', TMPDIR: '/tmp',
      npm_config_cache: '/home/test/.npm', npm_config_ignore_scripts: 'true',
      npm_config_audit: 'false', npm_config_fund: 'false' } });
  if (r.status !== 0) {
    npmDiagnostic();
    throw new Error(`Dependency preparation failed: npm ${args[0]} in ${cwd}; ${r.error?.message ?? `exit ${r.status}`}`);
  }
}
npm(['ci', '--ignore-scripts', '--no-audit', '--fund=false']);
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const workspaceFiles = ['/work/source/bench/package.json', ...readdirSync('/work/source/packages')
  .map((name) => join('/work/source/packages', name, 'package.json'))];
const workspaces = workspaceFiles.map(read);
const workspaceNames = new Set(workspaces.map((manifest) => manifest.name));
// npm ci already populated the locked producer development graph. Only actual
// canary consumers need development tools; published packages expose runtime
// and peer dependencies, never their Vitest/ESLint development dependencies.
const manifests = [
  ...['/work/source/canary/package.json', '/work/source/tui-consumer/package.json']
    .map((path) => ({ original: read(path), includeDevelopment: true })),
  ...workspaces.filter((manifest) => manifest.private !== true)
    .map((original) => ({ original, includeDevelopment: false })),
];
const lock = read('/work/source/package-lock.json');
function externalEntries(entries = {}) {
  return Object.fromEntries(Object.entries(entries).filter(([name, range]) => {
    if (workspaceNames.has(name)) return false;
    if (typeof range !== 'string') throw new Error(`Invalid dependency range: ${name}`);
    if (range.startsWith('https://')) {
      const bound = Object.entries(lock.packages).some(([path, entry]) =>
        path.endsWith(`node_modules/${name}`) && entry.resolved === range);
      if (!bound) throw new Error(`HTTPS dependency lacks matching lock entry: ${name}`);
      return true;
    }
    if (/^(file:|workspace:|https?:|git|\.\.?\/)/u.test(range)) throw new Error(`Unsupported external dependency: ${name}`);
    return true;
  }));
}
// Keep every consumer graph separate: equal package names with different ranges
// must not overwrite each other in a synthetic union. Real npm resolution warms
// transitive packuments and tarballs, including packages absent from the root lock.
const consumerRoot = '/work/consumer-cache';
for (const [index, { original, includeDevelopment }] of manifests.entries()) {
  const manifest = { name: `bijou-cache-consumer-${index}`, version: '0.0.0', private: true };
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (section === 'devDependencies' && !includeDevelopment) continue;
    const entries = externalEntries(original[section]);
    if (Object.keys(entries).length) manifest[section] = entries;
  }
  const peerMeta = Object.fromEntries(Object.entries(original.peerDependenciesMeta ?? {})
    .filter(([name]) => Object.hasOwn(manifest.peerDependencies ?? {}, name)));
  if (Object.keys(peerMeta).length) manifest.peerDependenciesMeta = peerMeta;
  if (!['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
    .some((section) => manifest[section])) continue;
  // Producer overrides govern the original lockfile installation above. They
  // are not inherited by an external consumer installing packed packages.
  mkdirSync(consumerRoot);
  try {
    process.stdout.write(`Preparing consumer graph ${index}: ${original.name}\n`);
    writeFileSync(join(consumerRoot, 'package.json'), JSON.stringify(manifest));
    npm(['install', '--ignore-scripts', '--no-audit', '--fund=false', '--package-lock=false'], consumerRoot);
  } finally { rmSync(consumerRoot, { recursive: true, force: true }); }
}
