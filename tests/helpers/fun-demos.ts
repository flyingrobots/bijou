import { createHash } from 'node:crypto';
import { createTestContext, type TestContext } from '@flyingrobots/bijou/adapters/test';
import type { Cell, Surface } from '@flyingrobots/bijou';
import type { DemoEntry, DemoMsg, Session } from '../../examples/fun/contract.js';
import { demos } from '../../examples/fun/registry.js';
import { fluidScript } from './fun-fluid.js';

export const SEED = 1888;
export const DT = 1 / 30;

export function funContext(columns: number, rows: number): TestContext {
  return createTestContext({ mode: 'interactive', runtime: { columns, rows } });
}

/** Every cell, read through `get`: the `cells` array does not follow `setRGB` writes into the packed buffer. */
export function cellsOf(surface: Surface): Cell[] {
  return Array.from({ length: surface.width * surface.height }, (_, i) => surface.get(i % surface.width, Math.floor(i / surface.width)));
}

export function textOf(surface: Surface): string {
  return cellsOf(surface).map((cell) => cell.char).join('');
}

export function digest(surface: Surface): string {
  return createHash('sha256').update(JSON.stringify(cellsOf(surface))).digest('hex');
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

/** The messages the recorded frames are made from: 30 pulses, the demo's own input, 30 more pulses. */
export function frameScript(id: string, width: number, height: number): DemoMsg[] {
  const own = fluidScript(id);
  if (own !== undefined) return own;
  const middle: DemoMsg[] = id === 'wormhole'
    ? [{ type: 'key', key: 'm' }]
    : id === 'metaballs' ? [{ type: 'pointer', col: Math.floor(width / 3), row: Math.floor(height / 2) }] : [];
  return [...pulses(30), ...middle, ...pulses(30)];
}
