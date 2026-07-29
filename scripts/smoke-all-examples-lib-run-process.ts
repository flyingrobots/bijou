import { spawn } from 'node:child_process';
import { detectGarbage, stripAnsi } from './smoke-utils.js';
import {
  type Result,
  type Scenario,
  type SmokeDeps,
} from './smoke-all-examples-lib-contract.js';
import {
  createScenarioPlan,
  mergeEnv,
} from './smoke-all-examples-lib-plan.js';
import { runInteractiveScriptedScenario } from './smoke-all-examples-lib-run-interactive.js';

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
  if (plan.stdin !== undefined) child.stdin?.end(plan.stdin);
  else child.stdin?.destroy();

  return new Promise<Result>((resolveResult) => {
    const chunks: Buffer[] = [];
    let settled = false;
    const finish = (status: Result['status'], reason?: string): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveResult({
        path: scenario.path,
        mode: scenario.mode,
        status,
        reason,
        output: stripAnsi(Buffer.concat(chunks).toString('utf8')),
      });
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish('error', `timeout ${String(plan.timeoutMs)}ms`);
    }, plan.timeoutMs);
    child.stdout?.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on('error', (error) => {
      finish('error', error.message);
    });
    child.on('close', (code) => {
      if (code !== 0) {
        finish(
          'error',
          `exited with code ${code == null ? 'null' : String(code)}`,
        );
        return;
      }
      const garbage = detectGarbage(
        stripAnsi(Buffer.concat(chunks).toString('utf8')),
      );
      finish(garbage == null ? 'ok' : 'error', garbage ?? undefined);
    });
  });
}
