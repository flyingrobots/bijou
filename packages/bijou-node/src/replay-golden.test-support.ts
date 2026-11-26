import { readFileSync } from 'node:fs';
import type { ReplayEventInput } from '@flyingrobots/bijou';

/** The bytes `GOLDEN_REPLAY_EVENTS` must serialize to, written by hand. */
export const GOLDEN_REPLAY_JSONL = readFileSync(
  new URL('./replay-outbox.golden.jsonl', import.meta.url),
  'utf8',
);

/** The golden frame's hash, computed independently of the implementation. */
export const GOLDEN_FRAME_HASH =
  'sha256:3e285a48879951c543928580df6ee2226847c8b289f232013b40c27487569e2a';

/**
 * A fixed event list. Keys are written out of canonical order on purpose,
 * and the debug fact holds `-0`, an escaped string, a BMP key above the
 * surrogate range and an astral key, to pin code-point key order.
 */
export const GOLDEN_REPLAY_EVENTS: readonly ReplayEventInput[] = [
  {
    tick: 0, atMs: 0, kind: 'session',
    payload: {
      viewport: { rows: 1, columns: 2 }, source: 'test', label: 'golden', claim: 'frame-playback',
      context: { theme: null, mode: 'static', colorLevel: null }, pulses: 'script', clock: 'mock',
    },
  },
  {
    payload: {
      width: 2, index: 0, height: 1, hash: GOLDEN_FRAME_HASH,
      styles: [{}, { modifiers: ['bold'], fg: [255, 0, 0] }],
      cells: [['é', 0], ['😀', 1]],
    },
    kind: 'frame', atMs: 0, tick: 0,
  },
  { tick: 0, atMs: 0, kind: 'command', payload: { phase: 'start', cmd: 0 } },
  {
    tick: 0, atMs: 16, kind: 'input',
    payload: { origin: 'script', msg: { type: 'key', key: 'q', shift: false, ctrl: false, alt: false } },
  },
  { tick: 0, atMs: 32, kind: 'pulse', payload: { origin: 'script', dt: 0.016 } },
  { tick: 1, atMs: 32, kind: 'resize', payload: { rows: 2, origin: 'command', columns: 3, cmd: 0 } },
  { tick: 1, atMs: 32, kind: 'command', payload: { phase: 'settle', outcome: 'message', cmd: 0 } },
  {
    tick: 1, atMs: 48, kind: 'debug-fact',
    payload: {
      value: { '😀': 'astral', 'ｚ': 'bmp', note: 'say "hi"\n', a: -0, Z: 1 },
      name: 'focus.target',
    },
  },
  { tick: 1, atMs: 48, kind: 'end', payload: { reason: 'steps-complete', pendingCommands: 0, frames: 1 } },
];

/** The smallest valid stream: `session` then `end`. */
export const EMPTY_SESSION_EVENTS: readonly ReplayEventInput[] = [
  GOLDEN_REPLAY_EVENTS[0] ?? missing(),
  { tick: 0, atMs: 0, kind: 'end', payload: { reason: 'steps-complete', pendingCommands: 0, frames: 0 } },
];

function missing(): never {
  throw new Error('golden session event is missing');
}
