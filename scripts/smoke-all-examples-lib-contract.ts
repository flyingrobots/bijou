import type { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const INTERACTIVE_FORM_SCRIPTS: Readonly<
  Record<string, InteractiveScriptScenarioSpec>
> = {
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

export interface SpawnPlan {
  readonly command: string;
  readonly args: readonly string[];
  readonly stdin?: string;
  readonly stdinMode: 'pipe' | 'ignore';
  readonly timeoutMs: number;
  readonly env: Record<string, string | null | undefined>;
}

export interface InteractiveModule {
  readonly main?: (...args: unknown[]) => unknown;
}

export interface SmokeDeps {
  readonly execSyncImpl?: (
    command: string,
    options: { cwd: string; encoding: 'utf8' },
  ) => string;
  readonly buildImpl?: (
    command: string,
    options: { cwd: string; stdio: 'ignore' },
  ) => unknown;
  readonly readFileImpl?: (
    path: string,
    encoding: BufferEncoding,
  ) => string;
  readonly spawnImpl?: typeof spawn;
  readonly runScenarioImpl?: (
    root: string,
    scenario: Scenario,
    deps: SmokeDeps,
  ) => Promise<Result>;
  readonly loadInteractiveModuleImpl?: (
    root: string,
    scenario: Scenario,
  ) => Promise<InteractiveModule>;
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
