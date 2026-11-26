import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import vitestConfig from '../vitest.config.js';
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
    ['its own request', '// vitest: isolate (patches Date)'],
    ['an import of the Node host package', "import { run } from '@flyingrobots/bijou-node';"],
    ['an import of the Node host source', "import { nodeIO } from '../packages/bijou-node/src/io.js';"],
  ])('isolates a file with %s', (_label, line) => {
    expect(needsIsolation(`import { it } from 'vitest';\n${line}\nit('x', () => {});\n`)).toBe(true);
  });

  it.each([
    ['plain tests', "it('adds', () => { expect(1 + 1).toBe(2); });"],
    ['an import of another package', "import { run } from '@flyingrobots/bijou-tui';"],
    ['an environment read', "const quiet = process.env.NO_COLOR === '1';"],
    ['an environment comparison', "if (process.env.CI == 'true') skip();"],
    ['a global read', 'const g = globalThis.navigator == undefined;'],
    // Measured safe to share on 2026-11-24: see needsIsolation.
    ['the default context', 'setDefaultContext(ctx);'],
    ['a default-context reset', '_resetDefaultContextForTesting();'],
    ['a request that is not at the start of a line', "const note = 'see // vitest: isolate';"],
  ])('lets a file with %s share', (_label, line) => {
    expect(needsIsolation(`import { it } from 'vitest';\n${line}\n`)).toBe(false);
  });
});

// Sharing modules is only safe if a file cannot inherit the default context the
// file before it left behind. In hosted CI a leftover pipe-mode context made
// `q` quit in another file's app, where its own interactive context asks first.
describe('every test file starts with no default context', () => {
  it('has the setup file that resets it, registered for every run', () => {
    const config = vitestConfig as { test?: { setupFiles?: unknown } };
    expect(config.test?.setupFiles).toEqual(['./scripts/vitest-setup.ts']);
    const setup = readFileSync(new URL('./vitest-setup.ts', import.meta.url), 'utf8');
    expect(setup).toMatch(/^_resetDefaultContextForTesting\(\);$/mu);
  });
});
