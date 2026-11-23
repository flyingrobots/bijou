// Lockfile packages resolved from a tarball inside the repository, such as the
// vendored Geordi packages of examples/web-gpu. The networked dependency worker
// receives only manifests and the lockfile, so these tarballs travel with them.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
export function localTarballs(lock) {
  const paths = new Set();
  for (const entry of Object.values(lock.packages ?? {})) {
    const resolved = entry?.resolved;
    if (typeof resolved !== 'string' || !resolved.startsWith('file:')) continue;
    const path = resolved.slice('file:'.length);
    const normal = posix.normalize(path);
    if (!path.endsWith('.tgz') || normal !== path || path.startsWith('/') || path.startsWith('../') || /^[a-zA-Z]:/u.test(path)) {
      throw new Error(`Unsupported local dependency in package-lock.json: ${resolved}`);
    }
    paths.add(path);
  }
  return [...paths].sort();
}
export function copyLocalTarballs(lock, source, target) {
  const paths = localTarballs(lock);
  for (const path of paths) {
    mkdirSync(dirname(join(target, path)), { recursive: true });
    copyFileSync(join(source, path), join(target, path));
  }
  return paths;
}
