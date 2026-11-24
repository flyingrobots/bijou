import { describe, expect, it } from 'vitest';
import { classifyChanges, FAST_JUSTIFICATIONS, LANE_RULES, type ChangedPath } from './verification-lane.js';

/** mulberry32: a seeded generator, so every run checks the same cases. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS = ['docs', 'docs/book', 'docs/releases', 'tests', 'tests/cycles/DF-1', 'scripts', 'scripts/hooks', 'scripts/docker-seal',
  'packages/bijou/src', 'packages/bijou', 'examples/docs', '.github/workflows', 'bench', 'bench/baselines', '', 'assets', 'docs/.x'];
const NAMES = ['a.md', 'b.test.ts', 'c.ts', 'd.mjs', 'package.json', 'tsconfig.json', 'README.md', 'e.pdf', '.nvmrc', 'f', 'g.test.mjs'];
const STATUSES = [null, 'A', 'M', 'D', 'R100', 'C050', 'T', 'U', 'X'];

function pick<T>(next: () => number, items: readonly T[]): T {
  const item = items[Math.floor(next() * items.length)];
  if (item === undefined) throw new Error('empty pick list');
  return item;
}

function change(next: () => number): ChangedPath {
  const dir = pick(next, DIRS);
  const name = pick(next, NAMES);
  return { path: dir === '' ? name : `${dir}/${name}`, status: pick(next, STATUSES) };
}

describe('verification lane properties', () => {
  it('never turns a full change set fast by adding any path', () => {
    const next = random(610);
    let fullSets = 0;
    for (let round = 0; round < 3000; round += 1) {
      const set = Array.from({ length: 1 + Math.floor(next() * 4) }, () => change(next));
      if (classifyChanges(set).lane !== 'full') continue;
      fullSets += 1;
      const extra = change(next);
      const at = Math.floor(next() * (set.length + 1));
      const grown = [...set.slice(0, at), extra, ...set.slice(at)];

      expect(classifyChanges(grown).lane, JSON.stringify(grown)).toBe('full');
    }
    expect(fullSets).toBeGreaterThan(1000);
  });

  it('decides a set as the heaviest of its paths, in any order', () => {
    const next = random(611);
    for (let round = 0; round < 1000; round += 1) {
      const set = Array.from({ length: 1 + Math.floor(next() * 5) }, () => change(next));
      const single = set.map((entry) => classifyChanges([entry]).lane);
      const expected = single.includes('full') ? 'full' : 'fast';

      expect(classifyChanges(set).lane).toBe(expected);
      expect(classifyChanges([...set].reverse()).lane).toBe(expected);
    }
  });
});

describe('fast allow-list justification', () => {
  const fastPatterns = LANE_RULES.filter((rule) => rule.lane === 'fast').map((rule) => rule.pattern);

  it('has a justification entry for every fast pattern', () => {
    for (const pattern of fastPatterns) {
      expect(FAST_JUSTIFICATIONS[pattern]?.trim().length ?? 0, pattern).toBeGreaterThan(40);
    }
  });

  it('justifies no pattern that is not in the fast allow-list', () => {
    expect(Object.keys(FAST_JUSTIFICATIONS).sort()).toEqual([...fastPatterns].sort());
  });

  it('lists every full rule before the first fast rule', () => {
    const firstFast = LANE_RULES.findIndex((rule) => rule.lane === 'fast');

    expect(firstFast).toBeGreaterThan(0);
    expect(LANE_RULES.slice(firstFast).every((rule) => rule.lane === 'fast')).toBe(true);
  });
});
