import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { detectGarbage } from './smoke-utils.js';
import {
  type DogfoodScenario,
  type SmokeDeps,
  type SmokeDogfoodResult,
  type SpawnPlan,
  DOGFOOD_CAPTURE_ENTRYPOINT,
  missingRequiredSnippets,
  normalizeDogfoodOutput,
} from './smoke-dogfood-lib.part01.js';
// Oversized captures fail rather than validating silently truncated output.
const MAX_CAPTURE_BYTES = 1024 * 1024;
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
  const args =
    platform === 'darwin'
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
    let capturedBytes = 0;
    let settled = false;

    const finish = (status: SmokeDogfoodResult['status'], reason?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const output = normalizeDogfoodOutput(
        Buffer.concat(chunks).toString('utf8'),
      );
      resolveResult({
        name: scenario.name,
        status,
        reason,
        output,
      });
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish('error', `timed out after ${String(plan.timeoutMs)}ms`);
    }, plan.timeoutMs);

    const capture = (chunk: Buffer) => {
      if (settled) return;
      if (capturedBytes + chunk.length > MAX_CAPTURE_BYTES) {
        child.kill('SIGKILL');
        finish('error', `capture output exceeded ${String(MAX_CAPTURE_BYTES)} bytes`);
        return;
      }
      capturedBytes += chunk.length;
      chunks.push(chunk);
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);

    child.on('error', (error) => {
      finish('error', error.message);
    });

    child.on('close', (code) => {
      if (settled) return;
      if (code !== 0) {
        finish(
          'error',
          `exited with code ${code == null ? 'null' : String(code)}`,
        );
        return;
      }

      const output = normalizeDogfoodOutput(
        Buffer.concat(chunks).toString('utf8'),
      );
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
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
function mergeEnv(
  base: NodeJS.ProcessEnv,
  overrides: Record<string, string | null | undefined>,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    env[key] = value ?? undefined;
  }
  return env;
}
