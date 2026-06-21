import { describe, expect, it } from 'vitest';
import { createScenarioPlan } from './smoke-all-examples-lib.js';

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
