import { createSurface } from '@flyingrobots/bijou';
import { defineDemo } from '../../examples/fun/contract.js';
import type { CatalogEntry, DemoHost } from '../../examples/fun/registry.js';

/** What the fakes saw: which entry was asked to load, with which host, and which seed its demo was mounted with. */
export interface FixtureLog {
  readonly loads: { readonly id: string; readonly host: DemoHost }[];
  readonly mounts: { readonly id: string; readonly seed: number }[];
}

export interface Fixture {
  readonly entries: readonly CatalogEntry[];
  readonly log: FixtureLog;
}

const IDS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'] as const;

/**
 * A catalog of fakes, for tests of what a host does with a catalog. No real demo is in it, so a demo added to or
 * removed from the real catalog cannot change these tests. Each fake paints `demo <id>` on its first row and records
 * its load and its mount in the log.
 */
export function fixtureCatalog(ids: readonly string[] = IDS): Fixture {
  const log: FixtureLog = { loads: [], mounts: [] };
  const entries = ids.map((id): CatalogEntry => {
    const name = `Fake ${id}`;
    const description = `The fake demo ${id}`;
    const demo = defineDemo<null>({
      id, name, description, keys: `${id} keys`,
      init: (seed) => { log.mounts.push({ id, seed }); return null; },
      update: (_msg, state) => state,
      view(_state, { width, height }) {
        const surface = createSurface(width, height);
        const line = `demo ${id}`;
        for (let i = 0; i < Math.min(width, line.length); i += 1) surface.set(i, 0, { char: line.charAt(i), empty: false });
        return surface;
      },
    });
    return { id, name, description, load: (host) => { log.loads.push({ id, host }); return Promise.resolve(demo); } };
  });
  return { entries, log };
}
