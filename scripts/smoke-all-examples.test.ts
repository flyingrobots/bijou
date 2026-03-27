import { describe, expect, it } from 'vitest';
import {
  buildSmokeScenarios,
  createScenarioPlan,
  listExampleTargets,
  runScenarioWithTimeout,
  ROOT,
} from './smoke-all-examples-lib.js';

describe('listExampleTargets', () => {
  it('prepends top-level demos and sorts discovered examples deterministically', () => {
    const targets = listExampleTargets('/repo', () => 'examples/zeta/main.ts\nexamples/alpha/main.ts\n');

    expect(targets).toEqual([
      'demo.ts',
      'demo-tui.ts',
      'examples/alpha/main.ts',
      'examples/zeta/main.ts',
    ]);
  });
});

describe('buildSmokeScenarios', () => {
  it('classifies TUI targets onto TTY launchers and plain scripts onto pipe mode', () => {
    const scenarios = buildSmokeScenarios(
      '/repo',
      ['demo.ts', 'demo-tui.ts', 'examples/plain/main.ts', 'examples/tui/main.ts'],
      (path) => path.endsWith('examples/tui/main.ts')
        ? 'import "@flyingrobots/bijou-tui";'
        : 'console.log("plain");',
    );

    const baseScenarios = scenarios.filter((scenario) => scenario.mode !== 'interactive-scripted');
    expect(baseScenarios).toEqual([
      { path: 'demo.ts', mode: 'pipe' },
      { path: 'demo-tui.ts', mode: 'static-tty' },
      { path: 'examples/plain/main.ts', mode: 'pipe' },
      { path: 'examples/tui/main.ts', mode: 'static-tty' },
    ]);
  });

  it('appends interactive scripted scenarios for form examples', () => {
    const scenarios = buildSmokeScenarios('/repo', ['demo.ts'], () => 'console.log("plain");');
    const interactive = scenarios.filter((scenario) => scenario.mode === 'interactive-scripted');

    expect(interactive.some((scenario) => scenario.path === 'examples/select/main.ts')).toBe(true);
    expect(interactive.some((scenario) => scenario.path === 'examples/wizard/main.ts')).toBe(true);
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
    const darwinPlan = createScenarioPlan('/repo', { path: 'demo-tui.ts', mode: 'static-tty' }, {
      platform: 'darwin',
      execPath: '/custom/node',
      env: {},
    });
    const linuxPlan = createScenarioPlan('/repo', { path: 'demo-tui.ts', mode: 'static-tty' }, {
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
      "/custom/node --import tsx '/repo/demo-tui.ts'",
    ]);
    expect(linuxPlan.args).toEqual([
      '-q',
      '-e',
      '-c',
      "/custom/node --import tsx '/repo/demo-tui.ts'",
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
  it('runs scripted interactive examples in-process', async () => {
    const result = await runScenarioWithTimeout(ROOT, {
      path: 'examples/select/main.ts',
      mode: 'interactive-scripted',
      script: { keys: ['\r'] },
    });

    expect(result.status).toBe('ok');
    expect(result.output).toContain('Selected package manager: YARN');
  });
});
