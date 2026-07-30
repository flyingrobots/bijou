import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createTestContext } from '../packages/bijou/src/adapters/test/index.js';
import { detectGarbage, stripAnsi } from './smoke-utils.js';
import {
  INTERACTIVE_FORM_SCRIPTS,
  type InteractiveModule,
  type Result,
  type Scenario,
  type SmokeDeps,
} from './smoke-all-examples-lib-contract.js';

export async function runInteractiveScriptedScenario(
  root: string,
  scenario: Scenario,
  deps: SmokeDeps = {},
): Promise<Result> {
  const spec = INTERACTIVE_FORM_SCRIPTS[scenario.path];
  if (spec === undefined) return failure(scenario, 'missing script');
  const module = deps.loadInteractiveModuleImpl == null
    ? await loadInteractiveModule(root, scenario)
    : await deps.loadInteractiveModuleImpl(root, scenario);
  if (typeof module.main !== 'function') {
    return failure(scenario, 'no main()');
  }
  const ctx = createTestContext({
    mode: 'interactive',
    io: {
      answers: [...(spec.answers ?? [])],
      keys: [...(spec.keys ?? [])],
    },
  });
  const output: string[] = [];
  const writeLine = (line = ''): void => {
    output.push(`${line}\n`);
  };
  const timeoutMs = deps.interactiveTimeoutMs ?? 5000;
  let timer: NodeJS.Timeout | undefined;
  try {
    const runMain = Promise.resolve(module.main(ctx, writeLine));
    await Promise.race([
      runMain,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`timed out after ${String(timeoutMs)}ms`));
        }, timeoutMs);
      }),
    ]);
  } catch (error: unknown) {
    return finalize(
      scenario,
      ctx.io.written.join('')
        + ctx.io.writtenErr.join('')
        + output.join(''),
      'error',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  return finalize(
    scenario,
    ctx.io.written.join('') + ctx.io.writtenErr.join('') + output.join(''),
    'ok',
  );
}

function finalize(
  scenario: Scenario,
  rawOutput: string,
  status: Result['status'],
  reason?: string,
): Result {
  const output = stripAnsi(rawOutput);
  const garbage = status === 'ok' ? detectGarbage(output) : null;
  return {
    path: scenario.path,
    mode: scenario.mode,
    status: garbage == null ? status : 'error',
    reason: garbage ?? reason,
    output,
  };
}

function failure(scenario: Scenario, reason: string): Result {
  return {
    path: scenario.path,
    mode: scenario.mode,
    status: 'error',
    reason,
  };
}

async function loadInteractiveModule(
  root: string,
  scenario: Scenario,
): Promise<InteractiveModule> {
  const module: unknown = await import(
    pathToFileURL(resolve(root, scenario.path)).href
  );
  return hasMain(module) ? { main: module.main } : {};
}

function hasMain(value: unknown): value is Required<InteractiveModule> {
  return typeof value === 'object'
    && value !== null
    && 'main' in value
    && typeof value.main === 'function';
}
