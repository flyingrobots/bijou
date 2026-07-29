import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  type DogfoodScenarioName,
  type SmokeDogfoodIO,
  type SmokeDogfoodOptions,
  type SmokeDogfoodResult,
  DOGFOOD_SCENARIOS,
  ROOT,
  selectDogfoodScenarios,
} from './smoke-dogfood-lib.part01.js';
import { runDogfoodScenario } from './smoke-dogfood-lib.part02.js';

export async function runSmokeDogfood(
  io: SmokeDogfoodIO = {},
): Promise<number> {
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
    write(`FAIL: ${result.reason ?? 'unknown'}\n`);
  }

  if (failures.length > 0) {
    write('\nFailures:\n');
    for (const failure of failures) {
      write(`- dogfood:${failure.name} ${failure.reason ?? 'unknown'}\n`);
    }
    return 1;
  }

  return 0;
}
export function parseSmokeDogfoodOptions(
  argv: readonly string[],
): SmokeDogfoodOptions {
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
      const raw = arg.slice('--scenario='.length);
      if (!isDogfoodScenarioName(raw)) {
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
export function defaultBuildExecSync(
  command: string,
  options: { cwd: string; stdio: 'ignore' },
): void {
  execSync(command, options);
}
export function isDogfoodScenarioName(
  value: string,
): value is DogfoodScenarioName {
  return value in DOGFOOD_SCENARIOS;
}
