import { describe, expect, it } from 'vitest';
import { selectSmokeScenarios } from './smoke-all-examples-lib.js';

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
