import { existsSync, realpathSync } from 'fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';
import type { ScopedNodeIO, ScopedNodeIOOptions } from './io-types.js';
import { nodeIO } from './node-io.js';

export class ScopedNodeIOError extends Error {
  constructor(root: string, requestedPath: string) {
    super(`Scoped node IO path escapes root "${root}": ${requestedPath}`);
    this.name = 'ScopedNodeIOError';
  }
}

/**
 * Create a Node.js I/O adapter whose filesystem access is constrained to a root directory.
 *
 * This wraps an {@link IOPort} and guards `readFile`, `readDir`, and `joinPath`
 * so app-level file access cannot escape the declared root. Hosts can also call
 * {@link ScopedNodeIO.resolvePath} before performing their own writes with Node's
 * filesystem APIs, preserving the same root boundary for output paths.
 *
 * @param options - Root path plus optional adapter overrides.
 * @returns An {@link ScopedNodeIO} rooted at the provided directory.
 */
export function scopedNodeIO(options: ScopedNodeIOOptions): ScopedNodeIO {
  const baseIO = options.baseIO ?? nodeIO({ clock: options.clock, stdout: options.stdout, stderr: options.stderr });
  const root = resolve(options.root);
  const realRoot = realpathSync.native(root);

  function assertWithinRoot(realCandidate: string, requestedPath: string): void {
    const rel = relative(realRoot, realCandidate);
    if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
      return;
    }
    throw new ScopedNodeIOError(root, requestedPath);
  }

  function resolvePathWithinRoot(requestedPath: string): string {
    const candidate = resolve(root, requestedPath);
    const suffix: string[] = [];
    let existingPath = candidate;

    while (!existsSync(existingPath)) {
      const parent = dirname(existingPath);
      if (parent === existingPath) {
        throw new ScopedNodeIOError(root, requestedPath);
      }
      suffix.unshift(basename(existingPath));
      existingPath = parent;
    }

    const realExistingPath = realpathSync.native(existingPath);
    const realCandidate = suffix.length === 0
      ? realExistingPath
      : resolve(realExistingPath, ...suffix);
    assertWithinRoot(realCandidate, requestedPath);
    return realCandidate;
  }

  return {
    ...baseIO,
    root,
    resolvePath(path: string): string {
      return resolvePathWithinRoot(path);
    },
    readFile(path: string): string {
      return baseIO.readFile(resolvePathWithinRoot(path));
    },
    readDir(path: string): string[] {
      return baseIO.readDir(resolvePathWithinRoot(path));
    },
    joinPath(...segments: string[]): string {
      return resolvePathWithinRoot(join(...segments));
    },
  };
}
