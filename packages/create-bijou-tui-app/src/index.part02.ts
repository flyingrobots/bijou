import { basename, resolve } from 'node:path';
import { DEFAULT_TARGET_DIR, toPackageName } from './index.part01.js';

/**
 * Normalize target directory and derive package name.
 */
export function resolveTarget(targetDir: string | undefined, cwd: string): {
  readonly targetDir: string;
  readonly absTargetDir: string;
  readonly packageName: string;
} {
  const normalizedTarget = targetDir?.trim().length
    ? targetDir
    : DEFAULT_TARGET_DIR;

  const absTargetDir = resolve(cwd, normalizedTarget);
  const base = basename(absTargetDir) || DEFAULT_TARGET_DIR;

  return {
    targetDir: normalizedTarget,
    absTargetDir,
    packageName: toPackageName(base),
  };
}
