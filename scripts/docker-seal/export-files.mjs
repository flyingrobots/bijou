// Runs inside the stopped-workload container. The host validates this JSON again.
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { posix } from 'node:path';

const root = '/work/source';
const files = [];
let total = 0;
const seen = new Set();

function visit(path) {
  if (seen.has(path)) return;
  seen.add(path);
  const parts = path.split('/');
  let current = root;
  for (const part of parts) {
    if (!part || part === '.' || part === '..') throw new Error('Invalid export path');
    current = posix.join(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error('Export contains a symlink');
  }
  const stat = lstatSync(current);
  if (stat.isDirectory()) {
    if (seen.size > 10_000) throw new Error('Export entry budget exceeded');
    for (const name of readdirSync(current).sort()) visit(posix.join(path, name));
    return;
  }
  if (!stat.isFile() || stat.nlink !== 1) throw new Error('Export must contain ordinary independent files');
  if (stat.size > 16 * 1024 ** 2) throw new Error('Export file exceeds 16 MiB');
  total += stat.size;
  if (total > 64 * 1024 ** 2 || files.length >= 10_000) throw new Error('Export budget exceeded');
  files.push({ path, data: readFileSync(current).toString('base64') });
}

for (const path of process.argv.slice(1)) visit(path);
process.stdout.write(JSON.stringify(files));
