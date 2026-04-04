import { execSync, spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectGarbage, stripAnsi } from './smoke-utils.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DOGFOOD_CAPTURE_ENTRYPOINT = 'examples/docs/capture-main.ts';

export type DogfoodScenarioName = 'landing' | 'docs';

export interface DogfoodScenario {
  readonly name: DogfoodScenarioName;
  readonly columns: number;
  readonly rows: number;
  readonly timeoutMs: number;
  readonly requiredSnippets: readonly string[];
}

export interface SmokeDogfoodOptions {
  readonly skipBuild?: boolean;
  readonly scenarios?: readonly DogfoodScenarioName[];
}

export interface SmokeDogfoodResult {
  readonly name: DogfoodScenarioName;
  readonly status: 'ok' | 'error';
  readonly reason?: string;
  readonly output?: string;
}

interface SpawnPlan {
  readonly command: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly env: Record<string, string | null | undefined>;
}

interface SmokeDeps {
  readonly buildImpl?: (command: string, options: { cwd: string; stdio: 'ignore' }) => unknown;
  readonly spawnImpl?: typeof spawn;
  readonly platform?: NodeJS.Platform;
  readonly execPath?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly runScenarioImpl?: (
    root: string,
    scenario: DogfoodScenario,
    deps: SmokeDeps,
  ) => Promise<SmokeDogfoodResult>;
}

export interface SmokeDogfoodIO extends SmokeDeps {
  readonly cwd?: string;
  readonly stdout?: (text: string) => void;
  readonly options?: SmokeDogfoodOptions;
}

export const DOGFOOD_SCENARIOS: Readonly<Record<DogfoodScenarioName, DogfoodScenario>> = {
  landing: {
    name: 'landing',
    columns: 120,
    rows: 36,
    timeoutMs: 15000,
    requiredSnippets: [
      'DOGFOOD',
      'Documentation Of Good Foundational Onboarding and Discovery',
      'Esc/q quit',
      'Enter continue',
      'Quit this app?',
    ],
  },
  docs: {
    name: 'docs',
    columns: 120,
    rows: 40,
    timeoutMs: 22000,
    requiredSnippets: [
      'Bijou Docs',
      'Guides',
      'Components',
      'Packages',
      'Philosophy',
      'Release',
      'Start Here',
      'What is Bijou?',
      'Search components',
      'Settings',
      'modal()',
    ],
  },
};

export function selectDogfoodScenarios(options: SmokeDogfoodOptions = {}): readonly DogfoodScenario[] {
  const names = options.scenarios != null && options.scenarios.length > 0
    ? options.scenarios
    : Object.keys(DOGFOOD_SCENARIOS) as DogfoodScenarioName[];
  return names.map((name) => {
    const scenario = DOGFOOD_SCENARIOS[name];
    if (scenario == null) {
      throw new Error(`unknown smoke:dogfood scenario: ${name}`);
    }
    return scenario;
  });
}

export function normalizeDogfoodOutput(rawOutput: string): string {
  let normalized = stripAnsi(rawOutput).replace(/\r/g, '\n');
  while (normalized.includes('\b')) {
    normalized = normalized.replace(/.\x08/g, '');
  }
  return normalized.replace(/[^\n\t\x20-\x7e]/g, '');
}

export function missingRequiredSnippets(
  output: string,
  scenario: DogfoodScenario,
): readonly string[] {
  return scenario.requiredSnippets.filter((snippet) => !output.includes(snippet));
}

export function createDogfoodScenarioPlan(
  root: string,
  scenario: DogfoodScenario,
  deps: SmokeDeps = {},
): SpawnPlan {
  const env = deps.env ?? process.env;
  const execPath = deps.execPath ?? process.execPath;
  const platform = deps.platform ?? process.platform;
  const entrypoint = resolve(root, DOGFOOD_CAPTURE_ENTRYPOINT);
  const command = `${execPath} --import tsx ${shellQuote(entrypoint)}`;
  const args = platform === 'darwin'
    ? ['-q', '/dev/null', 'zsh', '-lc', command]
    : ['-q', '-e', '-c', command, '/dev/null'];

  return {
    command: '/usr/bin/script',
    args,
    timeoutMs: scenario.timeoutMs,
    env: {
      ...env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      CI: '1',
      NO_COLOR: null,
      BIJOU_ACCESSIBLE: null,
      DOGFOOD_CAPTURE_COLUMNS: String(scenario.columns),
      DOGFOOD_CAPTURE_ROWS: String(scenario.rows),
      DOGFOOD_CAPTURE_SCENARIO: scenario.name,
    },
  };
}

export async function runDogfoodScenario(
  root: string,
  scenario: DogfoodScenario,
  deps: SmokeDeps = {},
): Promise<SmokeDogfoodResult> {
  const spawnImpl = deps.spawnImpl ?? spawn;
  const plan = createDogfoodScenarioPlan(root, scenario, deps);
  const child = spawnImpl(plan.command, [...plan.args], {
    cwd: root,
    env: mergeEnv(deps.env ?? process.env, plan.env),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise<SmokeDogfoodResult>((resolveResult) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const finish = (status: SmokeDogfoodResult['status'], reason?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const output = normalizeDogfoodOutput(Buffer.concat(chunks).toString('utf8'));
      resolveResult({
        name: scenario.name,
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

      const output = normalizeDogfoodOutput(Buffer.concat(chunks).toString('utf8'));
      const garbage = detectGarbage(output);
      if (garbage != null) {
        finish('error', garbage);
        return;
      }

      const missing = missingRequiredSnippets(output, scenario);
      if (missing.length > 0) {
        finish('error', `missing expected text: ${missing.join(', ')}`);
        return;
      }

      finish('ok');
    });
  });
}

export async function runSmokeDogfood(io: SmokeDogfoodIO = {}): Promise<number> {
  const root = resolve(io.cwd ?? ROOT);
  const write = io.stdout ?? ((text: string) => process.stdout.write(text));
  const buildImpl = io.buildImpl ?? defaultBuildExecSync;
  const runScenario = io.runScenarioImpl ?? runDogfoodScenario;
  const options = io.options ?? {};

  if (options.skipBuild !== true) {
    buildImpl('npx tsc -b', { cwd: root, stdio: 'ignore' });
  }

  const failures: SmokeDogfoodResult[] = [];
  for (const scenario of selectDogfoodScenarios(options)) {
    write(`smoke dogfood:${scenario.name} ... `);
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
      write(`- dogfood:${failure.name} ${failure.reason}\n`);
    }
    return 1;
  }

  return 0;
}

export function parseSmokeDogfoodOptions(argv: readonly string[]): SmokeDogfoodOptions {
  const options: {
    skipBuild?: boolean;
    scenarios?: DogfoodScenarioName[];
  } = {};

  for (const arg of argv) {
    if (arg === '--skip-build') {
      options.skipBuild = true;
      continue;
    }
    if (arg.startsWith('--scenario=')) {
      const raw = arg.slice('--scenario='.length) as DogfoodScenarioName;
      if (DOGFOOD_SCENARIOS[raw] == null) {
        throw new Error(`invalid --scenario value: ${raw}`);
      }
      options.scenarios ??= [];
      options.scenarios.push(raw);
      continue;
    }
    throw new Error(`unknown smoke:dogfood option: ${arg}`);
  }

  return options;
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
