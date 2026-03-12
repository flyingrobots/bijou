#!/usr/bin/env npx tsx

import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectGarbage,
  inputStep,
  resizeStep,
  rewritePackageManifestToTarballs,
  stripAnsi,
  type PtyStep,
} from './smoke-utils.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_ROOT = resolve(ROOT, 'scripts/canary-fixtures/core-static');
const KEEP_TEMP = process.env['BIJOU_KEEP_CANARY_TMP'] === '1';

interface PublishableUnit {
  readonly name: string;
  readonly dir: string;
}

interface CommandResult {
  readonly stdout: string;
  readonly stderr: string;
}

interface CommandOptions {
  readonly cwd: string;
  readonly env?: Record<string, string | null | undefined>;
  readonly timeoutMs?: number;
}

const TUI_CANARY_STEPS: readonly PtyStep[] = [
  inputStep(']', 500),
  inputStep('[', 350),
  inputStep('o', 350),
  inputStep('o', 550),
  resizeStep(120, 36, 700),
  resizeStep(92, 24, 700),
  inputStep('q', 400),
  inputStep('n', 250),
  inputStep('q', 350),
  inputStep('y', 250),
];

function main(): void {
  try {
    process.stdout.write('smoke-canaries: building workspace artifacts ... ');
    runCommand('workspace build', 'npm', ['run', 'build'], { cwd: ROOT }, { quietSuccess: true });
    process.stdout.write('ok\n');

    const tempRoot = mkdtempSync(join(tmpdir(), 'bijou-canaries-'));

    try {
      const tarballSpecs = packPublishableUnits(tempRoot);
      runTuiCanary(tempRoot, tarballSpecs);
      runCoreStaticCanary(tempRoot, tarballSpecs);
      process.stdout.write('smoke-canaries: all canaries passed\n');
    } finally {
      if (!KEEP_TEMP) {
        rmSync(tempRoot, { recursive: true, force: true });
      } else {
        process.stdout.write(`smoke-canaries: kept temp workspace at ${tempRoot}\n`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`smoke-canaries: FAIL\n${message}\n`);
    process.exitCode = 1;
  }
}

function discoverPublishableUnits(): readonly PublishableUnit[] {
  const packagesDir = resolve(ROOT, 'packages');
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(packagesDir, entry.name))
    .sort()
    .map((dir) => {
      const packageJsonPath = resolve(dir, 'package.json');
      const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name: string; private?: boolean };
      return { name: manifest.name, dir, private: manifest.private === true };
    })
    .filter((entry) => !entry.private)
    .map(({ name, dir }) => ({ name, dir }));
}

function packPublishableUnits(tempRoot: string): Readonly<Record<string, string>> {
  const tarballDir = resolve(tempRoot, 'tarballs');
  mkdirSync(tarballDir, { recursive: true });
  const tarballSpecs: Record<string, string> = {};

  for (const unit of discoverPublishableUnits()) {
    process.stdout.write(`pack ${unit.name} ... `);
    const result = runCommand(
      `pack ${unit.name}`,
      'npm',
      ['pack', '--json', '--pack-destination', tarballDir],
      { cwd: unit.dir },
      { quietSuccess: true },
    );
    const packed = parsePackResult(result.stdout, unit.name);
    tarballSpecs[unit.name] = `file:${resolve(tarballDir, packed.filename)}`;
    process.stdout.write('ok\n');
  }

  return tarballSpecs;
}

function runTuiCanary(tempRoot: string, tarballSpecs: Readonly<Record<string, string>>): void {
  const targetDir = resolve(tempRoot, 'generated-tui');
  process.stdout.write('generate TUI canary ... ');
  runCommand(
    'generate TUI canary',
    process.execPath,
    ['--import', 'tsx', resolve(ROOT, 'packages/create-bijou-tui-app/src/cli.ts'), targetDir, '--no-install'],
    { cwd: ROOT },
    { quietSuccess: true },
  );
  process.stdout.write('ok\n');

  rewriteManifest(resolve(targetDir, 'package.json'), tarballSpecs);

  runSimpleNpmLifecycle('install TUI canary', targetDir, ['install', '--no-fund', '--no-audit']);
  runSimpleNpmLifecycle('build TUI canary', targetDir, ['run', 'build']);

  process.stdout.write('run TUI canary ... ');
  const output = runPtyScenario(targetDir, TUI_CANARY_STEPS);
  assertOutput(
    'TUI canary',
    output,
    [
      'My Bijou App',
      'Home',
      'Split',
      'Home ready',
      'Split ready',
      'Panel drawer',
      '1/3',
      'Right pane',
      'Quit App?',
    ],
  );
  process.stdout.write('ok\n');
}

function runCoreStaticCanary(tempRoot: string, tarballSpecs: Readonly<Record<string, string>>): void {
  const targetDir = resolve(tempRoot, 'core-static');
  cpSync(FIXTURE_ROOT, targetDir, { recursive: true });
  rewriteManifest(resolve(targetDir, 'package.json'), tarballSpecs);

  runSimpleNpmLifecycle('install core/static canary', targetDir, ['install', '--no-fund', '--no-audit']);
  runSimpleNpmLifecycle('build core/static canary', targetDir, ['run', 'build']);

  process.stdout.write('run core/static canary ... ');
  const result = runCommand(
    'run core/static canary',
    process.execPath,
    ['dist/main.js'],
    {
      cwd: targetDir,
      env: {
        TERM: 'dumb',
        NO_COLOR: '1',
        CI: null,
      },
    },
    { quietSuccess: true, timeoutMs: 10000 },
  );
  const output = `${result.stdout}${result.stderr}`;
  assertOutput(
    'core/static canary',
    output,
    [
      'Static Core Canary',
      'Compatibility seam',
      'Surface status:',
      'One-shot report rendered cleanly.',
      'CANARY_STATIC_OK',
    ],
  );
  process.stdout.write('ok\n');
}

function runSimpleNpmLifecycle(label: string, cwd: string, args: readonly string[]): void {
  process.stdout.write(`${label} ... `);
  runCommand(label, 'npm', [...args], { cwd }, { quietSuccess: true, timeoutMs: 120000 });
  process.stdout.write('ok\n');
}

function runPtyScenario(cwd: string, steps: readonly PtyStep[]): string {
  const spec = {
    argv: [process.execPath, 'dist/main.js'],
    cwd,
    cols: 100,
    rows: 30,
    env: {
      TERM: 'xterm-256color',
      CI: null,
      NO_COLOR: null,
      BIJOU_ACCESSIBLE: null,
    },
    steps,
  };

  const result = runCommand(
    'run TUI canary',
    'python3',
    [resolve(ROOT, 'scripts/pty-driver.py')],
    {
      cwd: ROOT,
      env: {
        BIJOU_PTY_SPEC: JSON.stringify(spec),
      },
      timeoutMs: 20000,
    },
    { quietSuccess: true },
  );

  return `${result.stdout}${result.stderr}`;
}

function rewriteManifest(packageJsonPath: string, tarballSpecs: Readonly<Record<string, string>>): void {
  const source = readFileSync(packageJsonPath, 'utf8');
  const rewritten = rewritePackageManifestToTarballs(source, tarballSpecs);
  writeFileSync(packageJsonPath, rewritten, 'utf8');
}

function parsePackResult(stdout: string, packageName: string): { filename: string } {
  const trimmed = stdout.trim();
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
    throw new Error(`could not parse npm pack output for ${packageName}\n${trimmed}`);
  }

  const parsed = JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1)) as Array<{ filename?: string }>;
  const filename = parsed[0]?.filename;
  if (filename == null || filename === '') {
    throw new Error(`npm pack did not report a filename for ${packageName}\n${trimmed}`);
  }

  return { filename };
}

function assertOutput(label: string, output: string, expected: readonly string[]): void {
  const clean = stripAnsi(output);
  const garbage = detectGarbage(clean);
  if (garbage != null) {
    throw new Error(`${label} produced garbage output: ${garbage}\n${tail(clean)}`);
  }

  const missing = expected.filter((needle) => !clean.includes(needle));
  if (missing.length > 0) {
    throw new Error(`${label} output missing expected text: ${missing.join(', ')}\n${tail(clean)}`);
  }
}

function tail(text: string, lineCount = 80): string {
  const lines = text.trim().split('\n');
  return lines.slice(-lineCount).join('\n');
}

function runCommand(
  label: string,
  command: string,
  args: readonly string[],
  options: CommandOptions,
  behavior: { quietSuccess?: boolean; timeoutMs?: number } = {},
): CommandResult {
  const result = spawnSync(command, [...args], {
    cwd: options.cwd,
    env: mergeEnv(process.env, options.env),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: behavior.timeoutMs ?? options.timeoutMs,
  });

  if (result.error != null) {
    throw new Error(`${label} failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(formatFailure(label, command, args, result.stdout, result.stderr, result.status));
  }

  if (!behavior.quietSuccess) {
    process.stdout.write(result.stdout);
    process.stdout.write(result.stderr);
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function formatFailure(
  label: string,
  command: string,
  args: readonly string[],
  stdout: string,
  stderr: string,
  status: number | null,
): string {
  const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
  return [
    `${label} failed (${status ?? 'null'})`,
    `command: ${command} ${args.join(' ')}`,
    tail(stripAnsi(combined), 120),
  ].filter(Boolean).join('\n');
}

function mergeEnv(
  base: NodeJS.ProcessEnv,
  overrides: Record<string, string | null | undefined> | undefined,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base };
  if (overrides == null) return env;
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
}

main();
