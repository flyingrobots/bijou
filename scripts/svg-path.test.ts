import { describe, expect, it } from 'vitest';
import { parseBounded } from './svg-path.test-support.js';

describe('svg path parser: valid paths are unchanged', () => {
  it('closes a triangle with comma separators and implicit line repeats', () => {
    const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 0 }];
    expect(parseBounded('M0 0 L10 0 L10 10 Z')).toEqual([{ points: square }]);
    expect(parseBounded('M0,0 L10,0 10,10Z')).toEqual([{ points: square }]);
  });

  it('returns no polygons for empty input and accepts Z twice in a row', () => {
    expect(parseBounded('')).toEqual([]);
    expect(parseBounded(' \n ,')).toEqual([]);
    expect(parseBounded('M0 0 L1 0 L1 1 Z Z')).toHaveLength(1);
    expect(parseBounded('M0 0 L1 0 L1 1 Z')).toHaveLength(1);
  });
});

describe('svg path parser: a number after Z is rejected with its offset', () => {
  it.each([
    ['M0 0 L1 1 Z 5', 12],
    ['M0 0 L1 1 Z5', 11],
    ['M0 0 L1 1 Z -5', 12],
    ['M0 0 L1 1 Z .5', 12],
    ['M0 0 L1 1 Z,5', 12],
    ['M0 0 L1 1 Z  \n 5', 15],
    ['M0 0 L1 0 L1 1 Z 2 2', 17],
    ['M0 0 L1 1 Z 5 Z 5', 12],
  ] as const)('%j fails at offset %i', (path, offset) => {
    expect(() => parseBounded(path)).toThrow(new RegExp(`^SVG path.* offset ${String(offset)}\\b`));
  });
});

describe('svg path parser: malformed input throws instead of being reinterpreted', () => {
  it.each([
    'M', 'M 1', 'M 1 L 2 2', 'M 0 0 L', 'M 0 0 L 1', 'M 0 0 L 1 2 3',
    'M 0 0 Q 1 1 2', 'M 0 0 Q 1 1 2 2 3', 'M 0 0 L 1 1 Q', 'M 0 0 L Z',
  ])('rejects too few or too many numbers in %j', (path) => {
    expect(() => parseBounded(path)).toThrow(/^SVG path/);
  });

  it.each([
    ['m 0 0 l 10 0 l 0 10 z', 0],
    ['M0 0 L1 1 X', 10],
    ['M0 0 L1e5 1', 7],
    ['M0 0 L +1 1', 7],
    ['M0 0 L - 1', 7],
    ['M0 0 # 1 1', 5],
    ['M0 0 C 1 1 2 2 3 3', 5],
    ['M0 0 L1 1 l1 1', 10],
  ] as const)('rejects unsupported syntax in %j at offset %i', (path, offset) => {
    expect(() => parseBounded(path)).toThrow(new RegExp(`^SVG path.* offset ${String(offset)}\\b`));
  });
});
