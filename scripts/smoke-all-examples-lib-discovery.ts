import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';
import {
  INTERACTIVE_FORM_SCRIPTS,
  TOP_LEVEL,
  type Scenario,
  type SmokeRunOptions,
} from './smoke-all-examples-lib-contract.js';

export function listExampleTargets(
  root: string,
  execSyncImpl: typeof defaultDiscovery = defaultDiscovery,
): readonly string[] {
  const output = execSyncImpl(
    'find examples -maxdepth 2 -name main.ts | sort',
    { cwd: root, encoding: 'utf8' },
  );
  const examples = output
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  return [...TOP_LEVEL, ...examples];
}

export function isTuiTarget(
  root: string,
  relativePath: string,
  readFileImpl: (
    path: string,
    encoding: BufferEncoding,
  ) => string = readFileSync,
): boolean {
  if (relativePath === 'demo-tui.ts') return true;
  const source = readFileImpl(resolve(root, relativePath), 'utf8');
  return source.includes('@flyingrobots/bijou-tui');
}

export function buildSmokeScenarios(
  root: string,
  targets: readonly string[],
  readFileImpl: (
    path: string,
    encoding: BufferEncoding,
  ) => string = readFileSync,
): readonly Scenario[] {
  return [
    ...targets.map((path) => ({
      path,
      mode: isTuiTarget(root, path, readFileImpl)
        ? 'static-tty' as const
        : 'pipe' as const,
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
    if (options.fast === true && scenario.mode === 'static-tty') return false;
    if (
      options.modes != null
      && options.modes.length > 0
      && !options.modes.includes(scenario.mode)
    ) {
      return false;
    }
    return true;
  });
}

export function resolvePipeConcurrency(
  options: SmokeRunOptions = {},
): number {
  const explicit = options.pipeConcurrency;
  if (explicit !== undefined) {
    if (!Number.isFinite(explicit) || explicit < 1) {
      throw new Error(`pipeConcurrency ${String(explicit)}`);
    }
    return Math.max(1, Math.floor(explicit));
  }
  return Math.max(1, Math.min(4, availableParallelism()));
}

export function defaultDiscovery(
  command: string,
  options: { cwd: string; encoding: 'utf8' },
): string {
  return execSync(command, options);
}
