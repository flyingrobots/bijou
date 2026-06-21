import { describe, expect, it } from 'vitest';
import { runSmokeAllExamples } from './smoke-all-examples-lib.js';

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
      runScenarioImpl: (_root, scenario) => {
        executed.push(`${scenario.path}:${scenario.mode}`);
        return Promise.resolve({ path: scenario.path, mode: scenario.mode, status: 'ok' });
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
      runScenarioImpl: (_root, scenario) => {
        executed.push(`${scenario.path}:${scenario.mode}`);
        return Promise.resolve({ path: scenario.path, mode: scenario.mode, status: 'ok' });
      },
    });

    expect(exitCode).toBe(0);
    expect(executed).toEqual([
      'examples/select/main.ts:interactive-scripted',
      'examples/filter/main.ts:interactive-scripted',
    ]);
  });
});
