#!/usr/bin/env npx tsx

import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

const TOP_LEVEL = [
  'demo.ts',
  'demo-tui.ts',
] as const;

const EXAMPLES = execSync('find examples -maxdepth 2 -name main.ts | sort', {
  cwd: ROOT,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

const TARGETS = [...TOP_LEVEL, ...EXAMPLES];

interface ScriptStep {
  input: string;
  delayMs?: number;
}

const PLAIN_INPUTS: Readonly<Record<string, string>> = {
  'demo.ts': '2\n',
  'examples/confirm/main.ts': 'y\n',
  'examples/filter/main.ts': '1\n',
  'examples/form-group/main.ts': 'my-app\n1\n1,2\ny\n',
  'examples/input/main.ts': 'my-app\nA short description\n',
  'examples/multiselect/main.ts': '1,2\n',
  'examples/select/main.ts': '1\n',
  'examples/textarea/main.ts': 'test commit message\n',
  'examples/theme/main.ts': '',
  'examples/wizard/main.ts': '1\naws\ny\n',
};

const DEFAULT_INPUT = [
  '1',
  'y',
  'hello',
  '1,2',
  '.',
  '',
].join('\n').repeat(8);

const INTERACTIVE_FORM_SCRIPTS: Readonly<Record<string, readonly ScriptStep[]>> = {
  'demo.ts': [
    { input: '\x1b[B', delayMs: 250 },
    { input: '\r', delayMs: 120 },
  ],
  'examples/select/main.ts': [
    { input: '\x1b[B', delayMs: 250 },
    { input: '\r', delayMs: 120 },
  ],
  'examples/multiselect/main.ts': [
    { input: ' ', delayMs: 250 },
    { input: '\x1b[B', delayMs: 120 },
    { input: ' ', delayMs: 120 },
    { input: '\r', delayMs: 120 },
  ],
  'examples/filter/main.ts': [
    { input: '/', delayMs: 250 },
    { input: 'r', delayMs: 80 },
    { input: 'u', delayMs: 60 },
    { input: 's', delayMs: 60 },
    { input: 't', delayMs: 60 },
    { input: '\r', delayMs: 120 },
  ],
  'examples/input/main.ts': [
    { input: 'my-app\n', delayMs: 250 },
    { input: 'A short description\n', delayMs: 250 },
  ],
  'examples/textarea/main.ts': [
    { input: 'feat: smoke test', delayMs: 250 },
    { input: '\x04', delayMs: 120 },
  ],
  'examples/confirm/main.ts': [
    { input: 'y\n', delayMs: 250 },
  ],
  'examples/form-group/main.ts': [
    { input: 'my-app\n', delayMs: 250 },
    { input: '\r', delayMs: 250 },
    { input: ' ', delayMs: 250 },
    { input: '\x1b[B', delayMs: 120 },
    { input: ' ', delayMs: 120 },
    { input: '\r', delayMs: 120 },
    { input: 'y\n', delayMs: 250 },
  ],
  'examples/wizard/main.ts': [
    { input: '\r', delayMs: 250 },
    { input: 'aws\n', delayMs: 250 },
    { input: 'y\n', delayMs: 250 },
  ],
};

const RAW_SURFACE_PATTERNS = [
  /cells:\s*\[/,
  /clear:\s*\[Function:/,
  /transform:\s*\[Function:/,
  /width:\s*\d+,\s*\n\s*height:\s*\d+/,
  /\[object Object\]/,
];

const ERROR_PATTERNS = [
  /\[Pipeline Error\]/,
  /\bTypeError:/,
  /\bReferenceError:/,
  /\bSyntaxError:/,
  /\bUnhandled\b/i,
];

interface Result {
  path: string;
  mode: 'pipe' | 'static-tty' | 'interactive-tty';
  status: 'ok' | 'error';
  reason?: string;
  output?: string;
}

interface Scenario {
  path: string;
  mode: Result['mode'];
  steps?: readonly ScriptStep[];
}

function isTuiTarget(relativePath: string): boolean {
  if (relativePath === 'demo-tui.ts') return true;
  const source = readFileSync(resolve(ROOT, relativePath), 'utf8');
  return source.includes('@flyingrobots/bijou-tui');
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

function detectGarbage(cleanOutput: string): string | null {
  for (const pattern of RAW_SURFACE_PATTERNS) {
    if (pattern.test(cleanOutput)) {
      return `raw Surface dump matched ${pattern}`;
    }
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(cleanOutput)) {
      return `error output matched ${pattern}`;
    }
  }

  return null;
}

async function runScenarioWithTimeout(scenario: Scenario): Promise<Result> {
  const { path: relativePath, mode } = scenario;
  const absPath = resolve(ROOT, relativePath);
  const command = mode === 'static-tty'
    ? createStaticTtyChild(absPath)
    : mode === 'interactive-tty'
      ? createInteractiveTtyChild(absPath, scenario.steps ?? [])
      : createPipeChild(absPath, PLAIN_INPUTS[relativePath] ?? DEFAULT_INPUT);

  return new Promise<Result>((resolveResult) => {
    const chunks: Buffer[] = [];
    const timeoutMs = mode === 'static-tty' ? 8000 : mode === 'interactive-tty' ? 12000 : 5000;
    let settled = false;

    const finish = (status: Result['status'], reason?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const output = stripAnsi(Buffer.concat(chunks).toString('utf8'));
      resolveResult({
        path: relativePath,
        mode,
        status,
        reason,
        output,
      });
    };

    const timer = setTimeout(() => {
      command.kill('SIGKILL');
      finish('error', `timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    command.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));
    command.stderr?.on('data', (chunk: Buffer) => chunks.push(chunk));

    command.on('error', (error) => {
      finish('error', error.message);
    });

    command.on('close', (code) => {
      if (code !== 0) {
        finish('error', `exited with code ${code ?? 'null'}`);
        return;
      }

      const output = stripAnsi(Buffer.concat(chunks).toString('utf8'));
      const garbage = detectGarbage(output);
      if (garbage != null) {
        finish('error', garbage);
        return;
      }

      finish('ok');
    });
  });
}

function createPipeChild(absPath: string, input: string): ChildProcess {
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', absPath],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        NO_COLOR: '1',
        TERM: 'dumb',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );

  child.stdin?.end(input);
  return child;
}

function createStaticTtyChild(absPath: string): ChildProcess {
  const env = { ...process.env, CI: '1', TERM: 'xterm-256color' };
  delete env['NO_COLOR'];
  delete env['BIJOU_ACCESSIBLE'];
  const command = `${process.execPath} --import tsx ${shellQuote(absPath)}`;
  const args = process.platform === 'darwin'
    ? ['-q', '/dev/null', 'zsh', '-lc', command]
    : ['-q', '-e', '-c', command, '/dev/null'];

  return spawn(
    '/usr/bin/script',
    args,
    {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

function createInteractiveTtyChild(absPath: string, steps: readonly ScriptStep[]): ChildProcess {
  const spec = {
    argv: [process.execPath, '--import', 'tsx', absPath],
    cwd: ROOT,
    env: {
      TERM: 'xterm-256color',
      CI: null,
      NO_COLOR: null,
      BIJOU_ACCESSIBLE: null,
    },
    steps,
  };

  return spawn(
    'python3',
    [resolve(ROOT, 'scripts/pty-driver.py')],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        BIJOU_PTY_SPEC: JSON.stringify(spec),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

execSync('npx tsc -b', { cwd: ROOT, stdio: 'ignore' });

const scenarios: Scenario[] = [
  ...TARGETS.map((path) => ({
    path,
    mode: isTuiTarget(path) ? 'static-tty' as const : 'pipe' as const,
  })),
  ...Object.entries(INTERACTIVE_FORM_SCRIPTS).map(([path, steps]) => ({
    path,
    mode: 'interactive-tty' as const,
    steps,
  })),
];

const failures: Result[] = [];
for (const scenario of scenarios) {
  process.stdout.write(`smoke ${scenario.path} (${scenario.mode}) ... `);
  const result = await runScenarioWithTimeout(scenario);
  if (result.status === 'ok') {
    process.stdout.write('ok\n');
    continue;
  }

  failures.push(result);
  process.stdout.write(`FAIL: ${result.reason}\n`);
}

if (failures.length > 0) {
  process.stdout.write('\nFailures:\n');
  for (const failure of failures) {
    process.stdout.write(`- ${failure.path} [${failure.mode}] ${failure.reason}\n`);
  }
  process.exitCode = 1;
}
