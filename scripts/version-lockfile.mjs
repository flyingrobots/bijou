import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { execSync } from 'node:child_process';

const GROUPS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

function record(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value;
}

function readJson(path) {
  return record(JSON.parse(readFileSync(path, 'utf8')), path);
}

/** Refresh only owned metadata before npm reads its virtual workspace tree. */
export function regenerateWorkspaceLock(root, manifestPaths) {
  const lockPath = join(root, 'package-lock.json');
  const manifests = [join(root, 'package.json'), ...manifestPaths].map((path) => ({
    key: relative(root, dirname(path)).split(sep).join('/'), manifest: readJson(path),
  }));
  if (existsSync(lockPath)) {
    const lock = readJson(lockPath);
    if (lock.lockfileVersion !== 2 && lock.lockfileVersion !== 3) throw new Error('package-lock.json requires lockfileVersion 2 or 3');
    const packages = record(lock.packages, 'package-lock.json packages');
    for (const { key, manifest } of manifests) {
      const entry = packages[key] === undefined ? {} : record(packages[key], `package-lock.json ${key}`);
      if (typeof manifest.version === 'string') entry.version = manifest.version;
      for (const group of GROUPS) {
        if (manifest[group] === undefined) delete entry[group];
        else entry[group] = record(manifest[group], `${key} ${group}`);
      }
      packages[key] = entry;
    }
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  }
  execSync('npm install --package-lock-only --ignore-scripts --no-audit --no-fund', { cwd: root, stdio: 'inherit' });

  const packages = record(readJson(lockPath).packages, 'package-lock.json packages');
  const names = new Set(manifests.map(({ manifest }) => manifest.name));
  for (const { key, manifest } of manifests) {
    const entry = record(packages[key], `package-lock.json ${key}`);
    if (entry.version !== manifest.version) throw new Error(`npm left a stale package-lock.json version for ${key}`);
    for (const group of GROUPS) {
      const expected = record(manifest[group] ?? {}, `${key} ${group}`);
      const actual = record(entry[group] ?? {}, `package-lock.json ${key} ${group}`);
      for (const name of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
        if (names.has(name) && actual[name] !== expected[name]) throw new Error(`npm left a stale package-lock.json pin for ${key} ${name}`);
      }
    }
  }
}
