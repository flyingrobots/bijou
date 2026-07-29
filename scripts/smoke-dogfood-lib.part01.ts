import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripAnsi } from './smoke-utils.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DOGFOOD_CAPTURE_ENTRYPOINT = 'examples/docs/capture-main.ts';
export type DogfoodScenarioName = 'landing' | 'docs';
export const DOGFOOD_SCENARIO_NAMES: readonly DogfoodScenarioName[] = [
  'landing',
  'docs',
];
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
export interface SpawnPlan {
  readonly command: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly env: Record<string, string | null | undefined>;
}
export interface SmokeDeps {
  readonly buildImpl?: (
    command: string,
    options: { cwd: string; stdio: 'ignore' },
  ) => unknown;
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
export const DOGFOOD_SCENARIOS: Readonly<
  Record<DogfoodScenarioName, DogfoodScenario>
> = {
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
      'Search documentation',
      'Settings',
      'modal()',
    ],
  },
};
export function selectDogfoodScenarios(
  options: SmokeDogfoodOptions = {},
): readonly DogfoodScenario[] {
  const names =
    options.scenarios != null && options.scenarios.length > 0
      ? options.scenarios
      : DOGFOOD_SCENARIO_NAMES;
  return names.map((name) => DOGFOOD_SCENARIOS[name]);
}
export function normalizeDogfoodOutput(rawOutput: string): string {
  const output: string[] = [];
  for (const char of stripAnsi(rawOutput).replace(/\r\n?/g, '\n')) {
    if (char === '\b') {
      if (output.length > 0 && output[output.length - 1] !== '\n') {
        output.pop();
      }
      continue;
    }
    if (char === '\n' || char === '\t' || (char >= '\x20' && char <= '\x7e')) {
      output.push(char);
    }
  }
  return output.join('');
}
export function missingRequiredSnippets(
  output: string,
  scenario: DogfoodScenario,
): readonly string[] {
  return scenario.requiredSnippets.filter(
    (snippet) => !output.includes(snippet),
  );
}
