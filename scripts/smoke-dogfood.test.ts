import { describe, expect, it } from 'vitest';
import {
  createDogfoodScenarioPlan,
  DOGFOOD_SCENARIOS,
  missingRequiredSnippets,
  normalizeDogfoodOutput,
  parseSmokeDogfoodOptions,
  runSmokeDogfood,
  selectDogfoodScenarios,
} from './smoke-dogfood-lib.js';

describe('selectDogfoodScenarios', () => {
  it('defaults to the full DOGFOOD capture set', () => {
    expect(selectDogfoodScenarios().map((scenario) => scenario.name)).toEqual([
      'landing',
      'docs',
    ]);
  });

  it('supports targeting a specific DOGFOOD scenario', () => {
    expect(selectDogfoodScenarios({ scenarios: ['docs'] }).map((scenario) => scenario.name)).toEqual([
      'docs',
    ]);
  });
});

describe('normalizeDogfoodOutput', () => {
  it('strips ansi and noisy control characters from captured TTY output', () => {
    const raw = '\u0004A\b\u001b[31mDOGFOOD\u001b[0m\r\nPress [Enter]\n';

    expect(normalizeDogfoodOutput(raw)).toBe('DOGFOOD\n\nPress [Enter]\n');
  });
});

describe('missingRequiredSnippets', () => {
  it('reports which required witness text is absent', () => {
    expect(missingRequiredSnippets('DOGFOOD\nPress [Enter]\n', DOGFOOD_SCENARIOS.landing)).toContain(
      'Documentation Of Good Foundational Onboarding and Discovery',
    );
  });
});

describe('parseSmokeDogfoodOptions', () => {
  it('parses skip-build and repeated scenario flags', () => {
    expect(parseSmokeDogfoodOptions([
      '--skip-build',
      '--scenario=landing',
      '--scenario=docs',
    ])).toEqual({
      skipBuild: true,
      scenarios: ['landing', 'docs'],
    });
  });

  it('rejects unknown or malformed flags', () => {
    expect(() => parseSmokeDogfoodOptions(['--wat'])).toThrow('unknown smoke:dogfood option');
    expect(() => parseSmokeDogfoodOptions(['--scenario=pipe'])).toThrow('invalid --scenario value');
  });
});

describe('createDogfoodScenarioPlan', () => {
  it('uses platform-specific script launchers and capture env', () => {
    const darwinPlan = createDogfoodScenarioPlan('/repo', DOGFOOD_SCENARIOS.landing, {
      platform: 'darwin',
      execPath: '/custom/node',
      env: {},
    });
    const linuxPlan = createDogfoodScenarioPlan('/repo', DOGFOOD_SCENARIOS.docs, {
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
      "/custom/node --import tsx '/repo/examples/docs/capture-main.ts'",
    ]);
    expect(darwinPlan.env['DOGFOOD_CAPTURE_SCENARIO']).toBe('landing');
    expect(linuxPlan.args).toEqual([
      '-q',
      '-e',
      '-c',
      "/custom/node --import tsx '/repo/examples/docs/capture-main.ts'",
      '/dev/null',
    ]);
    expect(linuxPlan.env['DOGFOOD_CAPTURE_SCENARIO']).toBe('docs');
  });
});

describe('runSmokeDogfood', () => {
  it('skips the build when requested and runs selected scenarios in order', async () => {
    const executed: string[] = [];
    let buildCount = 0;

    const exitCode = await runSmokeDogfood({
      options: {
        skipBuild: true,
        scenarios: ['docs', 'landing'],
      },
      buildImpl() {
        buildCount += 1;
      },
      runScenarioImpl: async (_root, scenario) => {
        executed.push(scenario.name);
        return {
          name: scenario.name,
          status: 'ok',
        };
      },
    });

    expect(exitCode).toBe(0);
    expect(buildCount).toBe(0);
    expect(executed).toEqual(['docs', 'landing']);
  });
});
