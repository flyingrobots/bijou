import { createHash } from 'node:crypto';
import { createTestContext, type TestContext } from '@flyingrobots/bijou/adapters/test';
import type { Surface } from '@flyingrobots/bijou';
import type { DemoEntry, DemoMsg, Session } from '../../examples/fun/contract.js';
import { demos } from '../../examples/fun/registry.js';

export const SEED = 1888;
export const DT = 1 / 30;

export function funContext(columns: number, rows: number): TestContext {
  return createTestContext({ mode: 'interactive', runtime: { columns, rows } });
}

export function digest(surface: Surface): string {
  return createHash('sha256').update(JSON.stringify(surface.cells)).digest('hex');
}

export function feed(session: Session, messages: readonly DemoMsg[]): Session {
  return messages.reduce((current, msg) => current.update(msg), session);
}

export function pulses(count: number): DemoMsg[] {
  return Array.from({ length: count }, () => ({ type: 'pulse', dt: DT }));
}

export function mountEntry(entry: DemoEntry): Session {
  return entry.mount(SEED);
}

/** A small seeded generator for the fuzz test: never the clock, never Math.random. */
export function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function byId(id: string): DemoEntry {
  const found = demos.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no demo named ${id}`);
  return found;
}
