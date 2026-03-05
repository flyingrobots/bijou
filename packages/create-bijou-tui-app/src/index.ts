import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

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

/**
 * Create scaffolded file contents keyed by relative file path.
 */
export function createTemplateFiles(packageName: string): Readonly<Record<string, string>> {
  const pkg = {
    name: packageName,
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx src/main.ts',
      build: 'tsc -p tsconfig.json',
      start: 'node dist/main.js',
    },
    dependencies: {
      '@flyingrobots/bijou': 'latest',
      '@flyingrobots/bijou-node': 'latest',
      '@flyingrobots/bijou-tui': 'latest',
      '@flyingrobots/bijou-tui-app': 'latest',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      tsx: '^4.21.0',
      typescript: '^5.9.3',
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: 'ESNext',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      skipLibCheck: true,
      outDir: 'dist',
      rootDir: 'src',
    },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  };

  const mainTs = `import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createTuiAppSkeleton } from '@flyingrobots/bijou-tui-app';

const ctx = initDefaultContext();

await run(createTuiAppSkeleton({
  ctx,
  title: 'My Bijou App',
  statusMessage: ({ activeTabTitle }) => \`${'${activeTabTitle}'} ready\`,
}));
`;

  const readme = `# ${packageName}

Scaffolded with \`create-bijou-tui-app\`.

## Run

\`\`\`sh
npm install
npm run dev
\`\`\`

The default shell includes:
- full-screen framed app layout
- two starter tabs (drawer + split)
- command palette and help integration
- quit confirmation on \`q\` / \`ctrl+c\`
`;

  return {
    '.gitignore': 'node_modules\ndist\n',
    'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
    'tsconfig.json': `${JSON.stringify(tsconfig, null, 2)}\n`,
    'README.md': `${readme}\n`,
    'src/main.ts': mainTs,
  };
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

function ensureTargetWritable(absTargetDir: string, force: boolean): void {
  if (!existsSync(absTargetDir)) {
    mkdirSync(absTargetDir, { recursive: true });
    return;
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

function runInstall(packageManager: PackageManager, cwd: string): void {
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
