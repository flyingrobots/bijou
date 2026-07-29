import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inputStep, resizeStep, stripAnsi, type PtyStep } from './smoke-utils.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FIXTURE_ROOT = resolve(ROOT, 'scripts/canary-fixtures/core-static');

const KEEP_TEMP = process.env['BIJOU_KEEP_CANARY_TMP'] === '1';

const SKIP_PTY_TESTS = process.env['BIJOU_SKIP_PTY_TESTS'] === '1';

const SKIP_BUILD = process.argv.includes('--skip-build');

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
  inputStep('', 600, 'initial', 900),
  inputStep(']', 200, 'split', 650),
  inputStep('[', 200, 'home-return', 500),
  inputStep('o', 200, 'drawer-closed', 1200),
  resizeStep(120, 36, 200, 'resize-large', 700),
  resizeStep(92, 24, 200, 'resize-small', 700),
  inputStep('q', 200, 'quit-open', 450),
  inputStep('n', 200, 'quit-cancel', 450),
  inputStep('q', 200, 'quit-reopen', 450),
  inputStep('y', 250),
];

function tail(text: string, lineCount = 80): string {
  const lines = text.trim().split('\n');
  return lines.slice(-lineCount).join('\n');
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
    `${label} failed (${String(status ?? 'null')})`,
    `command: ${command} ${args.join(' ')}`,
    tail(stripAnsi(combined), 120),
  ].filter(Boolean).join('\n');
}

function mergeEnv(
  base: NodeJS.ProcessEnv,
  overrides: Record<string, string | null | undefined> | undefined,
): NodeJS.ProcessEnv {
  let env: NodeJS.ProcessEnv = { ...base };
  if (overrides == null) return env;
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      env = Object.fromEntries(Object.entries(env).filter(([envKey]) => envKey !== key));
    } else {
      env[key] = value;
    }
  }
  return env;
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

function requireJsonRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} is not an object`);
  return value;
}

function parseJsonRecord(text: string, label: string): Record<string, unknown> {
  return requireJsonRecord(JSON.parse(text), label);
}

function discoverPublishableUnits(): readonly PublishableUnit[] {
  const packagesDir = resolve(ROOT, 'packages');
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(packagesDir, entry.name))
    .sort()
    .map((dir) => {
      const packageJsonPath = resolve(dir, 'package.json');
      const manifest = parseJsonRecord(readFileSync(packageJsonPath, 'utf8'), packageJsonPath);
      const name = manifest['name'];
      if (typeof name !== 'string') throw new Error(`${packageJsonPath} is missing package name`);
      return { name, dir, private: manifest['private'] === true };
    })
    .filter((entry) => !entry.private)
    .map(({ name, dir }) => ({ name, dir }));
}

export { FIXTURE_ROOT, KEEP_TEMP, ROOT, SKIP_BUILD, SKIP_PTY_TESTS, TUI_CANARY_STEPS, discoverPublishableUnits, requireJsonRecord, runCommand, tail };
