import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  ROOT,
  type Result,
  type Scenario,
  type SmokeAllExamplesIO,
} from './smoke-all-examples-lib-contract.js';
import {
  buildSmokeScenarios,
  defaultDiscovery,
  listExampleTargets,
  resolvePipeConcurrency,
  selectSmokeScenarios,
} from './smoke-all-examples-lib-discovery.js';
import { runScenarioWithTimeout } from './smoke-all-examples-lib-run-process.js';

export async function runSmokeAllExamples(
  io: SmokeAllExamplesIO = {},
): Promise<number> {
  const root = resolve(io.cwd ?? ROOT);
  const write = io.stdout ?? ((text: string) => {
    process.stdout.write(text);
  });
  const build = io.buildImpl ?? defaultBuild;
  const runScenario = io.runScenarioImpl ?? runScenarioWithTimeout;
  const options = io.options ?? {};
  if (options.skipBuild !== true) {
    build('npx tsc -b', { cwd: root, stdio: 'ignore' });
  }
  const scenarios = selectSmokeScenarios(
    io.scenarios ?? buildSmokeScenarios(
      root,
      listExampleTargets(root, io.execSyncImpl ?? defaultDiscovery),
      io.readFileImpl,
    ),
    options,
  );
  const failures: Result[] = [];
  const pipe = scenarios.filter((scenario) => scenario.mode === 'pipe');
  const nonPipe = scenarios.filter((scenario) => scenario.mode !== 'pipe');
  for (const item of await runPool(
    root,
    pipe,
    io,
    resolvePipeConcurrency(options),
  )) {
    recordResult(item.scenario, item.result, failures, write);
  }
  for (const scenario of nonPipe) {
    writeScenarioStart(scenario, write);
    recordResult(
      scenario,
      await runScenario(root, scenario, io),
      failures,
      write,
      false,
    );
  }
  if (failures.length === 0) return 0;
  write('\nFailures:\n');
  for (const failure of failures) {
    write(
      `- ${failure.path} [${failure.mode}] ${failure.reason ?? '?'}\n`,
    );
  }
  return 1;
}

function recordResult(
  scenario: Scenario,
  result: Result,
  failures: Result[],
  write: (text: string) => void,
  includeStart = true,
): void {
  if (includeStart) writeScenarioStart(scenario, write);
  if (result.status === 'ok') {
    write('ok\n');
    return;
  }
  failures.push(result);
  write(`FAIL: ${result.reason ?? '?'}\n`);
}

function writeScenarioStart(
  scenario: Scenario,
  write: (text: string) => void,
): void {
  write(`smoke ${scenario.path} (${scenario.mode}) ... `);
}

async function runPool(
  root: string,
  scenarios: readonly Scenario[],
  io: SmokeAllExamplesIO,
  concurrency: number,
): Promise<readonly Readonly<{ scenario: Scenario; result: Result }>[]> {
  if (scenarios.length === 0) return [];
  const runScenario = io.runScenarioImpl ?? runScenarioWithTimeout;
  const results = new Array<{ scenario: Scenario; result: Result }>(
    scenarios.length,
  );
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < scenarios.length) {
      const index = cursor;
      cursor += 1;
      const scenario = scenarios[index];
      if (scenario === undefined) continue;
      results[index] = {
        scenario,
        result: await runScenario(root, scenario, io),
      };
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, scenarios.length) },
      () => worker(),
    ),
  );
  return results;
}

function defaultBuild(
  command: string,
  options: { cwd: string; stdio: 'ignore' },
): void {
  execSync(command, options);
}
