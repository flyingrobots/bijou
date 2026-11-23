import { describe, expect, it } from 'vitest';
import { hostReachOf } from '../helpers/host-reach.js';

// The import graph of each app module, resolved as the showcase bundles it:
// every Node built-in it imports and every Node host global it names.
describe('example app modules reach no Node host API', () => {
  it('finds a built-in behind two re-exports and host globals, and nothing in a shadow or a property name', async () => {
    expect(await hostReachOf('tests/fixtures/host-reach/entry.ts')).toEqual([
      'Buffer used by tests/fixtures/host-reach/global-read.ts',
      'node:fs imported by tests/fixtures/host-reach/reader.ts',
      'process used by tests/fixtures/host-reach/reader.ts',
    ]);
    expect(await hostReachOf('tests/fixtures/host-reach/clean.ts')).toEqual([]);
  });

  it.each([
    ['counter', 'examples/counter/main.ts'],
    ['showcase', 'examples/showcase/app.ts'],
    ['components', 'examples/components/library.ts'],
    ['hero', 'examples/hero/app.ts'],
    ['hero perf sampler', 'examples/hero/perf.ts'],
  ])('%s (%s) reaches none', async (_name, module) => {
    expect(await hostReachOf(module)).toEqual([]);
  });
});
