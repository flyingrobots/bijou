import { describe, expect, it } from 'vitest';
import { needsIsolation } from './vitest-shards.mjs';

// flyingrobots/bijou#907. Loading modules once per test file was about three
// quarters of the suite's time. Files that cannot affect each other share a
// worker's modules; a file that changes shared state keeps a graph of its own.
// The repository bans mocks and spies, and its scanner reads this file too, so the
// calls are spelled from parts here and never appear whole.
const call = (name: string, args: string): string => `vi.${name}(${args});`;

describe('which test files keep a module graph of their own', () => {
  it.each([
    ['a module mock', call('mock', "'./thing.js'")],
    ['a late module mock', call('doMock', "'./thing.js', () => ({})")],
    ['a global stub', call('stubGlobal', "'fetch', fake")],
    ['an environment stub', call('stubEnv', "'NO_COLOR', '1'")],
    ['fake timers', call('useFakeTimers', '')],
    ['a spy', call('spyOn', "console, 'log'")],
    ['a module registry reset', call('resetModules', '')],
    ['an environment write', "process.env.NO_COLOR = '1';"],
    ['an environment delete', 'delete process.env.NO_COLOR;'],
    ['a working-directory change', 'process.chdir(root);'],
    ['a global write', 'globalThis.navigator = fake;'],
    ['the default context', 'setDefaultContext(ctx);'],
    ['a default-context reset', '_resetDefaultContextForTesting();'],
    ['its own request', '// vitest: isolate (patches Date)'],
  ])('isolates a file with %s', (_label, line) => {
    expect(needsIsolation(`import { it } from 'vitest';\n${line}\nit('x', () => {});\n`)).toBe(true);
  });

  it.each([
    ['plain tests', "it('adds', () => { expect(1 + 1).toBe(2); });"],
    ['an environment read', "const quiet = process.env.NO_COLOR === '1';"],
    ['an environment comparison', "if (process.env.CI == 'true') skip();"],
    ['a global read', 'const g = globalThis.navigator == undefined;'],
    ['the word in prose', '// this file does not call setDefaultContext'],
    ['a request that is not at the start of a line', "const note = 'see // vitest: isolate';"],
  ])('lets a file with %s share', (_label, line) => {
    expect(needsIsolation(`import { it } from 'vitest';\n${line}\n`)).toBe(false);
  });
});
