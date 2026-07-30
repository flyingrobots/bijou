import { resolve } from 'node:path';
import {
  DEFAULT_INPUT,
  PLAIN_INPUTS,
  type Scenario,
  type SmokeDeps,
  type SpawnPlan,
} from './smoke-all-examples-lib-contract.js';

export function createScenarioPlan(
  root: string,
  scenario: Scenario,
  deps: SmokeDeps = {},
): SpawnPlan {
  const env = deps.env ?? process.env;
  const execPath = deps.execPath ?? process.execPath;
  const platform = deps.platform ?? process.platform;
  const absolutePath = resolve(root, scenario.path);
  if (scenario.mode === 'pipe') {
    return {
      command: execPath,
      args: ['--import', 'tsx', absolutePath],
      stdin: PLAIN_INPUTS[scenario.path] ?? DEFAULT_INPUT,
      stdinMode: 'pipe',
      timeoutMs: 5000,
      env: { ...env, NO_COLOR: '1', TERM: 'dumb' },
    };
  }
  if (scenario.mode === 'static-tty') {
    const command = `${quote(execPath)} --import tsx ${quote(absolutePath)}`;
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

export function mergeEnv(
  base: NodeJS.ProcessEnv,
  overrides: Record<string, string | null | undefined>,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    env[key] = value ?? undefined;
  }
  return env;
}

function quote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
