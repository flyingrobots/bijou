/** Supported package managers for post-scaffold install instructions. */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

/** Parsed CLI arguments for the scaffolder command. */
export interface ParsedArgs {
  /** Optional target directory argument (relative to cwd). */
  readonly targetDirArg?: string;
  /** Whether to run dependency installation after writing files. */
  readonly install: boolean;
  /** Whether to allow scaffolding into a non-empty target directory. */
  readonly force: boolean;
  /** Whether to print usage/help and exit. */
  readonly help: boolean;
}

/** Input options for {@link scaffoldProject}. */
export interface ScaffoldOptions {
  /** Target directory path (relative to `cwd` or absolute). */
  readonly targetDir?: string;
  /** Working directory used to resolve relative target paths. Defaults to process cwd. */
  readonly cwd?: string;
  /** Whether to run package install after file generation. Defaults to true. */
  readonly install?: boolean;
  /** Package manager to use for install/instructions. Defaults to auto-detection. */
  readonly packageManager?: PackageManager;
  /** Allow writing into a non-empty target directory. Defaults to false. */
  readonly force?: boolean;
}

/** Resolved scaffold metadata returned by {@link scaffoldProject}. */
export interface ScaffoldResult {
  /** Absolute target directory path where files were written. */
  readonly targetDir: string;
  /** Package name used in generated package.json. */
  readonly packageName: string;
  /** Package manager selected for install/instructions. */
  readonly packageManager: PackageManager;
  /** Whether dependencies were installed by the scaffolder. */
  readonly installed: boolean;
}

/** Default directory name when caller omits positional target argument. */
export const DEFAULT_TARGET_DIR = 'bijou-tui-app';

/**
 * Parse command-line arguments for the scaffolder.
 *
 * Supported flags:
 * - `-h`, `--help`
 * - `-y`, `--yes`, `--force`
 * - `--install`, `--no-install`
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  let targetDirArg: string | undefined;
  let install = true;
  let force = false;
  let help = false;

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      help = true;
      continue;
    }
    if (arg === '-y' || arg === '--yes' || arg === '--force') {
      force = true;
      continue;
    }
    if (arg === '--install') {
      install = true;
      continue;
    }
    if (arg === '--no-install') {
      install = false;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (targetDirArg !== undefined) {
      throw new Error('Only one target directory argument is supported');
    }
    targetDirArg = arg;
  }

  return { targetDirArg, install, force, help };
}

/** Detect package manager from npm user agent env. */
export function detectPackageManager(env: NodeJS.ProcessEnv = process.env): PackageManager {
  const ua = env['npm_config_user_agent'] ?? '';
  if (ua.startsWith('pnpm/')) return 'pnpm';
  if (ua.startsWith('yarn/')) return 'yarn';
  if (ua.startsWith('bun/')) return 'bun';
  return 'npm';
}

/**
 * Convert a directory basename into a valid npm package name.
 */
function toPackageName(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+/, '')
    .replace(/-+/g, '-')
    .replace(/[._-]+$/, '');

  return normalized.length > 0 ? normalized : DEFAULT_TARGET_DIR;
}

export { toPackageName };
