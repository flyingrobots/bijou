import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createTestContext } from '../packages/bijou/src/adapters/test/index.js';
import { detectGarbage, stripAnsi } from './smoke-utils.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const TOP_LEVEL: readonly string[] = [];

export const PLAIN_INPUTS: Readonly<Record<string, string>> = {
  'examples/filter/main.ts': '1\n',
  'examples/form-group/main.ts': 'my-app\n1\n1,2\ny\n',
  'examples/select/main.ts': '1\n',
  'examples/textarea/main.ts': 'test commit message\n',
  'examples/theme/main.ts': '',
};

export const DEFAULT_INPUT = [
  '1',
  'y',
  'hello',
  '1,2',
  '.',
  '',
].join('\n').repeat(8);

export interface InteractiveScriptScenarioSpec {
  readonly answers?: readonly string[];
  readonly keys?: readonly string[];
}

export const INTERACTIVE_FORM_SCRIPTS: Readonly<Record<string, InteractiveScriptScenarioSpec>> = {
  'examples/select/main.ts': {
    keys: ['\x1b[B', '\r'],
  },
  'examples/filter/main.ts': {
    keys: ['/', 'r', 'u', 's', 't', '\r'],
  },
  'examples/textarea/main.ts': {
    keys: ['feat: smoke test', '\x04'],
  },
  'examples/form-group/main.ts': {
    answers: ['my-app', 'y'],
    keys: ['\r', ' ', '\x1b[B', ' ', '\r'],
  },
};

export interface Result {
  path: string;
  mode: 'pipe' | 'static-tty' | 'interactive-scripted';
  status: 'ok' | 'error';
  reason?: string;
  output?: string;
}

export type ScenarioMode = Result['mode'];

export interface Scenario {
  path: string;
  mode: ScenarioMode;
  script?: InteractiveScriptScenarioSpec;
}

interface SpawnPlan {
  readonly command: string;
  readonly args: readonly string[];
  readonly stdin?: string;
  readonly stdinMode: 'pipe' | 'ignore';
  readonly timeoutMs: number;
  readonly env: Record<string, string | null | undefined>;
}

interface SmokeDeps {
  readonly execSyncImpl?: (command: string, options: { cwd: string; encoding: 'utf8' }) => string;
  readonly buildImpl?: (command: string, options: { cwd: string; stdio: 'ignore' }) => unknown;
  readonly readFileImpl?: (path: string, encoding: BufferEncoding) => string;
  readonly spawnImpl?: typeof spawn;
  readonly runScenarioImpl?: (
    root: string,
    scenario: Scenario,
    deps: SmokeDeps,
  ) => Promise<Result>;
  readonly loadInteractiveModuleImpl?: (
    root: string,
    scenario: Scenario,
  ) => Promise<InteractiveExampleModule>;
  readonly interactiveTimeoutMs?: number;
  readonly platform?: NodeJS.Platform;
  readonly execPath?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export interface SmokeAllExamplesIO extends SmokeDeps {
  readonly cwd?: string;
  readonly stdout?: (text: string) => void;
  readonly options?: SmokeRunOptions;
  readonly scenarios?: readonly Scenario[];
}

export interface SmokeRunOptions {
  readonly skipBuild?: boolean;
  readonly fast?: boolean;
  readonly pipeConcurrency?: number;
  readonly modes?: readonly ScenarioMode[];
}

export function listExampleTargets(
  root: string,
  execSyncImpl: (command: string, options: { cwd: string; encoding: 'utf8' }) => string = defaultExampleDiscoveryExecSync,
): readonly string[] {
  const examplesOutput = execSyncImpl('find examples -maxdepth 2 -name main.ts | sort', {
    cwd: root,
    encoding: 'utf8',
  });

  const examples = examplesOutput
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  return [...TOP_LEVEL, ...examples];
}

export function isTuiTarget(
  root: string,
  relativePath: string,
  readFileImpl: (path: string, encoding: BufferEncoding) => string = readFileSync,
): boolean {
  if (relativePath === 'demo-tui.ts') return true;
  const source = readFileImpl(resolve(root, relativePath), 'utf8');
  return source.includes('@flyingrobots/bijou-tui');
}

export function buildSmokeScenarios(
  root: string,
  targets: readonly string[],
  readFileImpl: (path: string, encoding: BufferEncoding) => string = readFileSync,
): readonly Scenario[] {
  return [
    ...targets.map((path) => ({
      path,
      mode: isTuiTarget(root, path, readFileImpl) ? 'static-tty' as const : 'pipe' as const,
    })),
    ...Object.entries(INTERACTIVE_FORM_SCRIPTS).map(([path, script]) => ({
      path,
      mode: 'interactive-scripted' as const,
      script,
    })),
  ];
}

export function selectSmokeScenarios(
  scenarios: readonly Scenario[],
  options: SmokeRunOptions = {},
): readonly Scenario[] {
  return scenarios.filter((scenario) => {
    if (options.fast === true && scenario.mode === 'static-tty') {
      return false;
    }
    if (options.modes != null && options.modes.length > 0 && !options.modes.includes(scenario.mode)) {
      return false;
    }
    return true;
  });
}

export function resolvePipeConcurrency(options: SmokeRunOptions = {}): number {
  const explicit = options.pipeConcurrency;
  if (explicit !== undefined) {
    if (!Number.isFinite(explicit) || explicit < 1) {
      throw new Error(`pipeConcurrency must be a positive integer, got ${explicit}`);
    }
    return Math.max(1, Math.floor(explicit));
  }
  return Math.max(1, Math.min(4, availableParallelism()));
}

export function createScenarioPlan(
  root: string,
  scenario: Scenario,
  deps: SmokeDeps = {},
): SpawnPlan {
  const env = deps.env ?? process.env;
  const execPath = deps.execPath ?? process.execPath;
  const platform = deps.platform ?? process.platform;
  const absPath = resolve(root, scenario.path);

  if (scenario.mode === 'pipe') {
    return {
      command: execPath,
      args: ['--import', 'tsx', absPath],
      stdin: PLAIN_INPUTS[scenario.path] ?? DEFAULT_INPUT,
      stdinMode: 'pipe',
      timeoutMs: 5000,
      env: {
        ...env,
        NO_COLOR: '1',
        TERM: 'dumb',
      },
    };
  }

  if (scenario.mode === 'static-tty') {
    const command = `${execPath} --import tsx ${shellQuote(absPath)}`;
    const args = platform === 'darwin'
      ? ['-q', '/dev/null', 'zsh', '-lc', command]
      : ['-q', '-e', '-c', command, '/dev/null'];

    return {
      command: '/usr/bin/script',
      args,
      stdinMode: 'ignore',
      timeoutMs: 8000,
      env: {
        ...env,
        CI: '1',
        TERM: 'xterm-256color',
        NO_COLOR: null,
        BIJOU_ACCESSIBLE: null,
      },
    };
  }

  throw new Error(`createScenarioPlan() does not support ${scenario.mode}`);
}

export async function runScenarioWithTimeout(
  root: string,
  scenario: Scenario,
  deps: SmokeDeps = {},
): Promise<Result> {
  if (scenario.mode === 'interactive-scripted') {
    return runInteractiveScriptedScenario(root, scenario, deps);
  }

  const spawnImpl = deps.spawnImpl ?? spawn;
  const plan = createScenarioPlan(root, scenario, deps);
  const child = spawnImpl(plan.command, [...plan.args], {
    cwd: root,
    env: mergeEnv(deps.env ?? process.env, plan.env),
    stdio: [plan.stdinMode, 'pipe', 'pipe'],
  });

  if (plan.stdin !== undefined) {
    child.stdin?.end(plan.stdin);
  } else {
    child.stdin?.destroy();
  }

  return new Promise<Result>((resolveResult) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const finish = (status: Result['status'], reason?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const output = stripAnsi(Buffer.concat(chunks).toString('utf8'));
      resolveResult({
        path: scenario.path,
        mode: scenario.mode,
        status,
        reason,
        output,
      });
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish('error', `timed out after ${plan.timeoutMs}ms`);
    }, plan.timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr?.on('data', (chunk: Buffer) => chunks.push(chunk));

    child.on('error', (error) => {
      finish('error', error.message);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        finish('error', `exited with code ${code ?? 'null'}`);
        return;
      }

      const output = stripAnsi(Buffer.concat(chunks).toString('utf8'));
      const garbage = detectGarbage(output);
      if (garbage != null) {
        finish('error', garbage);
        return;
      }

      finish('ok');
    });
  });
}

interface InteractiveExampleModule {
  readonly main?: (...args: unknown[]) => Promise<void>;
}

async function runInteractiveScriptedScenario(
  root: string,
  scenario: Scenario,
  deps: SmokeDeps = {},
): Promise<Result> {
  const spec = INTERACTIVE_FORM_SCRIPTS[scenario.path];
  if (spec === undefined) {
    return {
      path: scenario.path,
      mode: scenario.mode,
      status: 'error',
      reason: 'missing scripted interactive spec',
    };
  }

  const module = await (deps.loadInteractiveModuleImpl?.(root, scenario)
    ?? import(pathToFileURL(resolve(root, scenario.path)).href) as Promise<InteractiveExampleModule>);
  if (typeof module.main !== 'function') {
    return {
      path: scenario.path,
      mode: scenario.mode,
      status: 'error',
      reason: 'interactive example does not export main()',
    };
  }

  const ctx = createTestContext({
    mode: 'interactive',
    io: {
      answers: [...(spec.answers ?? [])],
      keys: [...(spec.keys ?? [])],
    },
  });

  const capturedOut: string[] = [];
  const writeLine = (line = '') => {
    capturedOut.push(`${line}\n`);
  };
  const interactiveTimeoutMs = deps.interactiveTimeoutMs ?? 5000;
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    const runMain = scenario.path === 'demo.ts'
      ? Promise.resolve(module.main(ctx, (_themeName: string, currentCtx: typeof ctx) => currentCtx, writeLine))
      : Promise.resolve(module.main(ctx, writeLine));

    await Promise.race([
      runMain,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`timed out after ${interactiveTimeoutMs}ms`));
        }, interactiveTimeoutMs);
      }),
    ]);
  } catch (error) {
    return finalizeInteractiveResult(
      scenario,
      ctx.io.written.join('') + ctx.io.writtenErr.join('') + capturedOut.join(''),
      'error',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }

  return finalizeInteractiveResult(
    scenario,
    ctx.io.written.join('') + ctx.io.writtenErr.join('') + capturedOut.join(''),
    'ok',
  );
}

function finalizeInteractiveResult(
  scenario: Scenario,
  rawOutput: string,
  status: Result['status'],
  reason?: string,
): Result {
  const output = stripAnsi(rawOutput);
  if (status === 'ok') {
    const garbage = detectGarbage(output);
    if (garbage != null) {
      return {
        path: scenario.path,
        mode: scenario.mode,
        status: 'error',
        reason: garbage,
        output,
      };
    }
  }
  return {
    path: scenario.path,
    mode: scenario.mode,
    status,
    reason,
    output,
  };
}

export async function runSmokeAllExamples(io: SmokeAllExamplesIO = {}): Promise<number> {
  const root = resolve(io.cwd ?? ROOT);
  const write = io.stdout ?? ((text: string) => process.stdout.write(text));
  const execSyncImpl = io.execSyncImpl ?? defaultExampleDiscoveryExecSync;
  const buildImpl = io.buildImpl ?? defaultBuildExecSync;
  const runScenario = io.runScenarioImpl ?? runScenarioWithTimeout;
  const options = io.options ?? {};

  if (options.skipBuild !== true) {
    buildImpl('npx tsc -b', { cwd: root, stdio: 'ignore' });
  }

  const scenarios = selectSmokeScenarios(
    io.scenarios ?? buildSmokeScenarios(
      root,
      listExampleTargets(root, execSyncImpl),
      io.readFileImpl,
    ),
    options,
  );

  const failures: Result[] = [];
  const pipeScenarios = scenarios.filter((scenario) => scenario.mode === 'pipe');
  const nonPipeScenarios = scenarios.filter((scenario) => scenario.mode !== 'pipe');

  for (const { scenario, result } of await runScenariosInPool(root, pipeScenarios, io, resolvePipeConcurrency(options))) {
    write(`smoke ${scenario.path} (${scenario.mode}) ... `);
    if (result.status === 'ok') {
      write('ok\n');
      continue;
    }

    failures.push(result);
    write(`FAIL: ${result.reason}\n`);
  }

  for (const scenario of nonPipeScenarios) {
    write(`smoke ${scenario.path} (${scenario.mode}) ... `);
    const result = await runScenario(root, scenario, io);
    if (result.status === 'ok') {
      write('ok\n');
      continue;
    }

    failures.push(result);
    write(`FAIL: ${result.reason}\n`);
  }

  if (failures.length > 0) {
    write('\nFailures:\n');
    for (const failure of failures) {
      write(`- ${failure.path} [${failure.mode}] ${failure.reason}\n`);
    }
    return 1;
  }

  return 0;
}

async function runScenariosInPool(
  root: string,
  scenarios: readonly Scenario[],
  io: SmokeAllExamplesIO,
  concurrency: number,
): Promise<Array<{ scenario: Scenario; result: Result }>> {
  if (scenarios.length === 0) return [];
  const runScenario = io.runScenarioImpl ?? runScenarioWithTimeout;
  const results = new Array<{ scenario: Scenario; result: Result }>(scenarios.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < scenarios.length) {
      const index = cursor++;
      const scenario = scenarios[index]!;
      const result = await runScenario(root, scenario, io);
      results[index] = { scenario, result };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, scenarios.length) }, () => worker()));
  return results;
}

export function parseSmokeRunOptions(argv: readonly string[]): SmokeRunOptions {
  const options: {
    skipBuild?: boolean;
    fast?: boolean;
    pipeConcurrency?: number;
    modes?: ScenarioMode[];
  } = {};
  const validModes = new Set<ScenarioMode>(['pipe', 'static-tty', 'interactive-scripted']);
  for (const arg of argv) {
    if (arg === '--skip-build') {
      options.skipBuild = true;
      continue;
    }
    if (arg === '--fast') {
      options.fast = true;
      continue;
    }
    if (arg.startsWith('--pipe-concurrency=')) {
      const raw = arg.slice('--pipe-concurrency='.length);
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || String(parsed) !== raw) {
        throw new Error(`invalid --pipe-concurrency value: ${raw}`);
      }
      options.pipeConcurrency = parsed;
      continue;
    }
    if (arg.startsWith('--mode=')) {
      const raw = arg.slice('--mode='.length) as ScenarioMode;
      if (!validModes.has(raw)) {
        throw new Error(`invalid --mode value: ${raw}`);
      }
      options.modes ??= [];
      options.modes.push(raw);
      continue;
    }
    throw new Error(`unknown smoke:examples option: ${arg}`);
  }
  return options;
}

function defaultExampleDiscoveryExecSync(
  command: string,
  options: { cwd: string; encoding: 'utf8' },
): string {
  return execSync(command, options);
}

function defaultBuildExecSync(
  command: string,
  options: { cwd: string; stdio: 'ignore' },
): void {
  execSync(command, options);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function mergeEnv(
  base: NodeJS.ProcessEnv,
  overrides: Record<string, string | null | undefined>,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
}
