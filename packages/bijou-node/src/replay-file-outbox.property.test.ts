import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as fc from 'fast-check';
import { afterAll, describe, expect, it } from 'vitest';
import {
  canonicalJson,
  createMemoryReplayOutbox,
  surfaceFrameHash,
  type ReplayEventInput,
} from '@flyingrobots/bijou';
import { createReplayFileOutbox } from './replay-file-outbox.js';

const SEED = 600;
const root = mkdtempSync(join(tmpdir(), 'bijou-replay-prop-'));
let runs = 0;

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const count = fc.nat({ max: 10_000 });

const debugFact = fc.record({
  tick: count, atMs: count, kind: fc.constant('debug-fact' as const),
  payload: fc.record({ name: fc.string({ minLength: 1 }), value: fc.jsonValue() }),
});

const input = fc.record({
  tick: count, atMs: count, kind: fc.constant('input' as const),
  payload: fc.record({ origin: fc.constant('script' as const), msg: fc.jsonValue() }),
});

const frame = fc
  .record({
    width: fc.integer({ min: 1, max: 4 }),
    height: fc.integer({ min: 1, max: 3 }),
    chars: fc.array(fc.string({ unit: 'grapheme', minLength: 1, maxLength: 1 }), { minLength: 12, maxLength: 12 }),
    index: count,
  })
  .map(({ width, height, chars, index }): ReplayEventInput => {
    const styles = [{}, { fg: [1, 2, 3] as const, modifiers: ['bold'] }];
    const cells = chars.slice(0, width * height).map((char, at) => [char, at % 2] as const);
    const content = { width, height, styles, cells };
    return { tick: 0, atMs: 0, kind: 'frame', payload: { ...content, index, hash: surfaceFrameHash(content) } };
  });

const events = fc.array(fc.oneof(debugFact, input, frame), { maxLength: 40 });

function toFile(sequence: readonly ReplayEventInput[]): string {
  runs += 1;
  const path = join(root, `run-${String(runs)}.jsonl`);
  const outbox = createReplayFileOutbox(path);
  for (const event of sequence) outbox.append(event);
  outbox.close();
  return readFileSync(path, 'utf8');
}

describe('ReplayOutbox properties (seeded random event sequences)', () => {
  it('writes byte-identical JSONL in memory and on disk, in seq order, canonically', () => {
    fc.assert(
      fc.property(events, (sequence) => {
        const memory = createMemoryReplayOutbox();
        for (const event of sequence) memory.append(event);
        memory.close();
        const fileText = toFile(sequence);
        expect(fileText).toBe(memory.toJSONL());
        const lines = fileText.split('\n');
        expect(lines.pop()).toBe('');
        expect(lines).toHaveLength(sequence.length);
        lines.forEach((line, seq) => {
          const parsed: unknown = JSON.parse(line);
          expect(canonicalJson(parsed)).toBe(line);
          expect(memory.events()[seq]?.seq).toBe(seq);
          expect(memory.events()[seq]?.kind).toBe(sequence[seq]?.kind);
        });
      }),
      { seed: SEED, numRuns: 60 },
    );
  });

  it('gives the same bytes for the same sequence on every run', () => {
    fc.assert(
      fc.property(events, (sequence) => {
        expect(toFile(sequence)).toBe(toFile(sequence));
      }),
      { seed: SEED, numRuns: 30 },
    );
  });
});
