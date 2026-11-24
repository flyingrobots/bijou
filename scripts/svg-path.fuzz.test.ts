import { describe, expect, it } from 'vitest';
import { parseBounded } from './svg-path.test-support.js';

const ALPHABET = 'MLQZmlqzCc0123456789+-.,e \n#x';
const VALID = [
  'M0 0 L10 0 L10 10 Z',
  'M 0 0 L 10 0 L 10 10 L 0 10 Z M 3 3 L 7 3 L 7 7 Z',
  'M0 0 Q5 10 10 0 L10 10 Z',
  'M0.5,0.5 L1.5,.5 1.5,1.5Z',
];
const SEED = Number(process.env['SVG_PATH_FUZZ_SEED'] ?? 473);

/** mulberry32: a small seeded generator so a failing input replays exactly. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mutate(source: string, random: () => number): string {
  const chars = Array.from(source);
  for (let edit = 0, count = 1 + Math.floor(random() * 4); edit < count; edit++) {
    const at = Math.floor(random() * (chars.length + 1));
    const char = ALPHABET[Math.floor(random() * ALPHABET.length)] ?? ' ';
    const kind = random();
    if (kind < 0.4) chars.splice(at, 0, char);
    else if (kind < 0.7) chars.splice(at, 1);
    else chars.splice(at, 1, char);
  }
  return chars.join('');
}

describe('svg path parser fuzz', () => {
  it('terminates within its step budget and returns polygons or a documented error', () => {
    process.stderr.write(`svg-path fuzz seed=${String(SEED)}\n`);
    const random = seeded(SEED);
    const inputs: string[] = [];
    for (let n = 0; n < 4000; n++) {
      const length = Math.floor(random() * 40);
      inputs.push(Array.from({ length }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join(''));
    }
    for (let n = 0; n < 2000; n++) inputs.push(mutate(VALID[n % VALID.length] ?? '', random));

    let parsed = 0;
    let rejected = 0;
    for (const input of inputs) {
      try {
        const polygons = parseBounded(input);
        expect(Array.isArray(polygons), `seed ${String(SEED)} input ${JSON.stringify(input)}`).toBe(true);
        parsed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message, `seed ${String(SEED)} input ${JSON.stringify(input)}`).toMatch(/^SVG path/);
        rejected++;
      }
    }
    expect(parsed).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);
  });
});
