import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';

const limit = 64 * 1024 ** 2;
const excluded = /^(?:\.git|\.env(?:\..*)?|\.npmrc|node_modules|\.claude|\.ssh)$/u;

export function validateExportPath(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes('\0') ||
      posix.isAbsolute(path) || path.split('/').some((part) =>
        !part || part === '.' || part === '..' || excluded.test(part))) {
    throw new Error('Export path must be a relative artifact path without credentials or repository internals');
  }
  return path;
}

/** Copy only requested ordinary artifacts into a new, owned evidence directory. */
export async function exportArtifacts({ worker, paths, destination, execute }) {
  if (paths.length === 0) return { files: 0, bytes: 0 };
  paths.forEach(validateExportPath);
  const source = readFileSync(new URL('./export-files.mjs', import.meta.url), 'utf8');
  const result = await execute([
    'docker', 'exec', worker, 'node', '--input-type=module', '-e', source, '--', ...paths,
  ], { binary: true, maxBytes: 96 * 1024 ** 2, timeout: 60_000 });
  const rows = JSON.parse(result.output.toString('utf8'));
  if (!Array.isArray(rows) || rows.length > 10_000) throw new Error('Invalid export manifest');
  const seen = new Set();
  let total = 0;
  const files = rows.map((row) => {
    const path = validateExportPath(row.path);
    if (seen.has(path) || !paths.some((request) => path === request || path.startsWith(`${request}/`))) {
      throw new Error('Unrequested or duplicate export');
    }
    seen.add(path);
    if (typeof row.data !== 'string' || row.data.length > Math.ceil(16 * 1024 ** 2 / 3) * 4) {
      throw new Error('Invalid export bytes');
    }
    const data = Buffer.from(row.data, 'base64');
    if (data.toString('base64') !== row.data) throw new Error('Invalid export encoding');
    total += data.length;
    if (data.length > 16 * 1024 ** 2 || total > limit) throw new Error('Export byte budget exceeded');
    return { path, data };
  });
  mkdirSync(destination, { recursive: false, mode: 0o700 });
  for (const { path, data } of files) {
    const output = join(destination, path);
    mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
    writeFileSync(output, data, { flag: 'wx', mode: 0o600 });
  }
  return { files: files.length, bytes: total };
}
