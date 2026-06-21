import { describe, expect, it } from 'vitest';
import { runScenarioWithTimeout, ROOT } from './smoke-all-examples-lib.js';

function call(value: unknown, line?: string): void {
  if (typeof value === 'function') Reflect.apply(value, undefined, line ? [line] : []);
}

describe('runScenarioWithTimeout', () => {
  it('runs scripted interactive examples through an injected fixture module', async () => {
    const result = await runScenarioWithTimeout(ROOT, {
      path: 'examples/select/main.ts',
      mode: 'interactive-scripted',
      script: { keys: ['\r'] },
    }, {
      loadInteractiveModuleImpl: () => Promise.resolve({
        main(...args: unknown[]) {
          call(args[1]);
          call(args[1], 'Selected package manager: YARN');
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
      loadInteractiveModuleImpl: () => Promise.resolve({
        main() {
          return new Promise<void>(() => undefined);
        },
      }),
    });

    expect(result.status).toBe('error');
    expect(result.reason).toBe('timed out after 20ms');
  });
});
