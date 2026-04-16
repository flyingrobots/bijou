import { describe, expect, it } from 'vitest';
import {
  buildSmokeScenarios,
  createScenarioPlan,
  type Result,
  listExampleTargets,
  parseSmokeRunOptions,
  resolvePipeConcurrency,
  runScenarioWithTimeout,
  runSmokeAllExamples,
  ROOT,
  selectSmokeScenarios,
} from './smoke-all-examples-lib.js';

describe('listExampleTargets', () => {
  it('sorts discovered examples deterministically', () => {
    const targets = listExampleTargets('/repo', () => 'examples/zeta/main.ts\nexamples/alpha/main.ts\n');

    expect(targets).toEqual([
      'examples/alpha/main.ts',
      'examples/zeta/main.ts',
    ]);
  });
});

describe('buildSmokeScenarios', () => {
  it('classifies TUI targets onto TTY launchers and plain scripts onto pipe mode', () => {
    const scenarios = buildSmokeScenarios(
      '/repo',
      ['examples/plain/main.ts', 'examples/tui/main.ts'],
      (path) => path.endsWith('examples/tui/main.ts')
        ? 'import "@flyingrobots/bijou-tui";'
        : 'console.log("plain");',
    );

    const baseScenarios = scenarios.filter((scenario) => scenario.mode !== 'interactive-scripted');
    expect(baseScenarios).toEqual([
      { path: 'examples/plain/main.ts', mode: 'pipe' },
      { path: 'examples/tui/main.ts', mode: 'static-tty' },
    ]);
  });

  it('appends interactive scripted scenarios for form examples', () => {
    const scenarios = buildSmokeScenarios('/repo', ['examples/select/main.ts'], () => 'console.log("plain");');
    const interactive = scenarios.filter((scenario) => scenario.mode === 'interactive-scripted');

    expect(interactive.some((scenario) => scenario.path === 'examples/select/main.ts')).toBe(true);
  });
});

describe('selectSmokeScenarios', () => {
  it('drops static TTY scenarios in fast mode while keeping pipe and scripted cases', () => {
    const scenarios = selectSmokeScenarios([
      { path: 'examples/counter/main.ts', mode: 'pipe' },
      { path: 'examples/v3-demo/main.ts', mode: 'static-tty' },
      { path: 'examples/select/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
    ], {
      fast: true,
    });

    expect(scenarios).toEqual([
      { path: 'examples/counter/main.ts', mode: 'pipe' },
      { path: 'examples/select/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
    ]);
  });

  it('filters scenarios down to explicitly requested modes', () => {
    const scenarios = selectSmokeScenarios([
      { path: 'examples/counter/main.ts', mode: 'pipe' },
      { path: 'examples/v3-demo/main.ts', mode: 'static-tty' },
      { path: 'examples/select/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
    ], {
      modes: ['static-tty', 'interactive-scripted'],
    });

    expect(scenarios).toEqual([
      { path: 'examples/v3-demo/main.ts', mode: 'static-tty' },
      { path: 'examples/select/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
    ]);
  });
});

describe('resolvePipeConcurrency', () => {
  it('uses an explicit positive integer when provided', () => {
    expect(resolvePipeConcurrency({ pipeConcurrency: 3 })).toBe(3);
  });

  it('bounds the default concurrency to a small local worker pool', () => {
    const concurrency = resolvePipeConcurrency();
    expect(concurrency).toBeGreaterThanOrEqual(1);
    expect(concurrency).toBeLessThanOrEqual(4);
  });
});

describe('parseSmokeRunOptions', () => {
  it('parses fast, skip-build, and pipe concurrency flags', () => {
    expect(parseSmokeRunOptions([
      '--fast',
      '--skip-build',
      '--pipe-concurrency=2',
    ])).toEqual({
      fast: true,
      skipBuild: true,
      pipeConcurrency: 2,
    });
  });

  it('collects repeated mode flags', () => {
    expect(parseSmokeRunOptions([
      '--mode=pipe',
      '--mode=interactive-scripted',
    ])).toEqual({
      modes: ['pipe', 'interactive-scripted'],
    });
  });

  it('rejects unknown or malformed flags', () => {
    expect(() => parseSmokeRunOptions(['--wat'])).toThrow('unknown smoke:examples option');
    expect(() => parseSmokeRunOptions(['--pipe-concurrency=nope'])).toThrow('invalid --pipe-concurrency value');
    expect(() => parseSmokeRunOptions(['--mode=banana'])).toThrow('invalid --mode value');
  });
});

describe('createScenarioPlan', () => {
  it('uses the pipe launcher with default input for unknown plain targets', () => {
    const plan = createScenarioPlan('/repo', { path: 'examples/plain/main.ts', mode: 'pipe' }, {
      execPath: '/custom/node',
      env: { HOME: '/tmp/test-home' },
    });

    expect(plan.command).toBe('/custom/node');
    expect(plan.args).toEqual(['--import', 'tsx', '/repo/examples/plain/main.ts']);
    expect(plan.stdin).toContain('hello');
    expect(plan.env['TERM']).toBe('dumb');
    expect(plan.env['NO_COLOR']).toBe('1');
  });

  it('uses platform-specific static TTY launchers', () => {
    const darwinPlan = createScenarioPlan('/repo', { path: 'examples/v3-demo/main.ts', mode: 'static-tty' }, {
      platform: 'darwin',
      execPath: '/custom/node',
      env: {},
    });
    const linuxPlan = createScenarioPlan('/repo', { path: 'examples/v3-demo/main.ts', mode: 'static-tty' }, {
      platform: 'linux',
      execPath: '/custom/node',
      env: {},
    });

    expect(darwinPlan.command).toBe('/usr/bin/script');
    expect(darwinPlan.args).toEqual([
      '-q',
      '/dev/null',
      'zsh',
      '-lc',
      "/custom/node --import tsx '/repo/examples/v3-demo/main.ts'",
    ]);
    expect(linuxPlan.args).toEqual([
      '-q',
      '-e',
      '-c',
      "/custom/node --import tsx '/repo/examples/v3-demo/main.ts'",
      '/dev/null',
    ]);
  });

  it('does not build spawn plans for scripted interactive scenarios', () => {
    expect(() => createScenarioPlan('/repo', {
      path: 'examples/select/main.ts',
      mode: 'interactive-scripted',
      script: { keys: ['\r'] },
    }, {
      execPath: '/custom/node',
      env: {},
    })).toThrow('does not support interactive-scripted');
  });
});

describe('runScenarioWithTimeout', () => {
  it('runs scripted interactive examples through an injected fixture module', async () => {
    const result = await runScenarioWithTimeout(ROOT, {
      path: 'examples/select/main.ts',
      mode: 'interactive-scripted',
      script: { keys: ['\r'] },
    }, {
      loadInteractiveModuleImpl: async () => ({
        async main(...args: unknown[]) {
          const writeLine = args[1] as ((line?: string) => void) | undefined;
          writeLine?.();
          writeLine?.('Selected package manager: YARN');
        },
      }),
    });

    expect(result.status).toBe('ok');
    expect(result.output).toContain('Selected package manager: YARN');
  });

  it('times out scripted interactive examples inside the harness', async () => {
    const result = await runScenarioWithTimeout(ROOT, {
      path: 'examples/select/main.ts',
      mode: 'interactive-scripted',
      script: { keys: ['\r'] },
    }, {
      interactiveTimeoutMs: 20,
      loadInteractiveModuleImpl: async () => ({
        main() {
          return new Promise<void>(() => {});
        },
      }),
    });

    expect(result.status).toBe('error');
    expect(result.reason).toBe('timed out after 20ms');
  });
});

describe('runSmokeAllExamples', () => {
  it('skips the build and fast-filters static TTY scenarios when requested', async () => {
    const executed: string[] = [];
    let buildCount = 0;

    const exitCode = await runSmokeAllExamples({
      options: {
        skipBuild: true,
        fast: true,
      },
      scenarios: [
        { path: 'examples/counter/main.ts', mode: 'pipe' },
        { path: 'examples/v3-demo/main.ts', mode: 'static-tty' },
        { path: 'examples/select/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
      ],
      buildImpl() {
        buildCount += 1;
      },
      runScenarioImpl: async (_root, scenario) => {
        executed.push(`${scenario.path}:${scenario.mode}`);
        return {
          path: scenario.path,
          mode: scenario.mode,
          status: 'ok',
        };
      },
    });

    expect(exitCode).toBe(0);
    expect(buildCount).toBe(0);
    expect(executed).toEqual([
      'examples/counter/main.ts:pipe',
      'examples/select/main.ts:interactive-scripted',
    ]);
  });

  it('runs pipe scenarios in parallel up to the configured concurrency', async () => {
    let active = 0;
    let peak = 0;

    const exitCode = await runSmokeAllExamples({
      options: {
        skipBuild: true,
        pipeConcurrency: 2,
      },
      scenarios: [
        { path: 'examples/plain-a.ts', mode: 'pipe' },
        { path: 'examples/plain-b.ts', mode: 'pipe' },
        { path: 'examples/plain-c.ts', mode: 'pipe' },
      ],
      runScenarioImpl: async (_root, scenario) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return {
          path: scenario.path,
          mode: scenario.mode,
          status: 'ok',
        };
      },
    });

    expect(exitCode).toBe(0);
    expect(peak).toBe(2);
  });

  it('keeps scripted interactive smoke serial and separate from pipe concurrency', async () => {
    const executed: string[] = [];

    const exitCode = await runSmokeAllExamples({
      options: {
        skipBuild: true,
        pipeConcurrency: 4,
        modes: ['interactive-scripted'],
      },
      scenarios: [
        { path: 'examples/select/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
        { path: 'examples/filter/main.ts', mode: 'interactive-scripted', script: { keys: ['\r'] } },
      ],
      runScenarioImpl: async (_root, scenario) => {
        executed.push(`${scenario.path}:${scenario.mode}`);
        return {
          path: scenario.path,
          mode: scenario.mode,
          status: 'ok',
        } satisfies Result;
      },
    });

    expect(exitCode).toBe(0);
    expect(executed).toEqual([
      'examples/select/main.ts:interactive-scripted',
      'examples/filter/main.ts:interactive-scripted',
    ]);
  });
});
