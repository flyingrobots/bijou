import { readdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';

const MiB = 1024 ** 2;

/**
 * Measure a toolchain context, refusing symlinks and the entry and byte limits.
 * A running step may remove an entry after it was listed (bzip2 deletes its
 * input); an entry that is gone holds nothing, so it is skipped. A directory
 * that the walk listed and that is gone when read counts as empty, by an
 * explicit check for `ENOENT` on that one read. A missing root and every other
 * error still fail.
 */
export function measureContext(path, state = { entries: 0, bytes: 0 }, files = { readdirSync, lstatSync }, listed = false) {
  let names;
  try { names = files.readdirSync(path); } catch (error) {
    if (listed && error.code === 'ENOENT') return 0;
    throw error;
  }
  return names.reduce((total, name) => {
    if (++state.entries > 100000) throw new Error('Toolchain context exceeds 100000 entries');
    const child = join(path, name); const stat = files.lstatSync(child, { throwIfNoEntry: false });
    if (!stat) return total;
    if (stat.isSymbolicLink()) throw new Error('Toolchain context symlink refused');
    if (stat.isDirectory()) return total + measureContext(child, state, files, true);
    state.bytes += stat.size;
    if (state.bytes > 1024 * MiB) throw new Error('Toolchain context exceeds 1 GiB');
    return total + stat.size;
  }, 0);
}
