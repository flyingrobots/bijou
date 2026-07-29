import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { detectPackageManager, resolveTarget } from './index.part01.js';
import type { PackageManager, ScaffoldOptions, ScaffoldResult } from './index.part01.js';
import { createTemplateFiles } from './index.part03.js';

/**
 * Ensure the target directory exists, is a directory, and is empty unless forced.
 *
 * When checking emptiness, `.git` and `.DS_Store` entries are filtered out so
 * that a directory containing only those entries is treated as empty.
 */
function ensureTargetWritable(absTargetDir: string, force: boolean): void {
  if (!existsSync(absTargetDir)) {
    mkdirSync(absTargetDir, { recursive: true });
    return;
  }

  if (!lstatSync(absTargetDir).isDirectory()) {
    throw new Error(
      `Target path is not a directory: ${absTargetDir}\n` +
      'Choose a different directory path.',
    );
  }

  const entries = readdirSync(absTargetDir)
    .filter((name) => name !== '.git' && name !== '.DS_Store');
  if (entries.length > 0 && !force) {
    throw new Error(
      `Target directory is not empty: ${absTargetDir}\n` +
      'Pass --yes to allow writing into a non-empty directory.',
    );
  }
}

/** Spawn the package manager's install command synchronously. */
function runInstall(packageManager: PackageManager, cwd: string): void {
  const VALID_MANAGERS = new Set(['npm', 'pnpm', 'yarn', 'bun']);
  if (!VALID_MANAGERS.has(packageManager)) {
    throw new Error(`Unsupported package manager: ${packageManager}`);
  }
  const args = packageManager === 'yarn' ? [] : ['install'];
  const result = spawnSync(packageManager, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${packageManager} install failed`);
  }
}

/**
 * Scaffold a new Bijou TUI app project.
 */
export function scaffoldProject(options: ScaffoldOptions = {}): ScaffoldResult {
  const cwd = options.cwd ?? process.cwd();
  const target = resolveTarget(options.targetDir, cwd);
  const packageManager = options.packageManager ?? detectPackageManager();
  const install = options.install ?? true;
  const force = options.force ?? false;

  ensureTargetWritable(target.absTargetDir, force);

  const files = createTemplateFiles(target.packageName);
  for (const [relPath, content] of Object.entries(files)) {
    const absPath = join(target.absTargetDir, relPath);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, content, 'utf8');
  }

  if (install) {
    runInstall(packageManager, target.absTargetDir);
  }

  return {
    targetDir: target.absTargetDir,
    packageName: target.packageName,
    packageManager,
    installed: install,
  };
}

/** Build usage/help text for CLI output. */
export function usage(): string {
  return [
    'Usage: npm create bijou-tui-app@latest [directory] [options]',
    '',
    'Options:',
    '  -h, --help        Show this help message',
    '  -y, --yes         Allow writing into non-empty target directory',
    '  --force           Alias for --yes',
    '  --install         Run dependency installation (default)',
    '  --no-install      Skip dependency installation',
  ].join('\n');
}
