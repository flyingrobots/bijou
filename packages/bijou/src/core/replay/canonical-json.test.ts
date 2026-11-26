import { describe, expect, it } from 'vitest';
import { canonicalJson, compareCodePoints } from './canonical-json.js';
import { ReplayOutboxError } from './replay-outbox-error.js';

function rejection(value: unknown): { code: string; path: string } {
  try {
    canonicalJson(value);
  } catch (error) {
    if (error instanceof ReplayOutboxError) return { code: error.code, path: error.path };
    throw error;
  }
  throw new Error('expected canonicalJson to reject the value');
}

const holed: number[] = [];
holed[2] = 3;

describe('canonicalJson()', () => {
  it('sorts object keys by code point and writes no whitespace', () => {
    expect(canonicalJson({ b: 1, a: [true, null, 'x'], c: { z: 0, y: 1 } }))
      .toBe('{"a":[true,null,"x"],"b":1,"c":{"y":1,"z":0}}');
  });

  it('orders a BMP key above the surrogate range before an astral key', () => {
    // UTF-16 code-unit order would put the astral key (0xD83D...) first.
    expect(canonicalJson({ '😀': 1, 'ｚ': 2 })).toBe('{"ｚ":2,"😀":1}');
    expect(compareCodePoints('ｚ', '😀')).toBeLessThan(0);
    expect(compareCodePoints('a', 'ab')).toBeLessThan(0);
    expect(compareCodePoints('ab', 'ab')).toBe(0);
  });

  it('writes -0 as 0 and escapes strings as JSON.stringify does', () => {
    expect(canonicalJson([-0, 0.5, 1e21, 'q"\n\u0001', '\ud800'])).toBe(
      `[0,0.5,1e+21,${JSON.stringify('q"\n\u0001')},"\\ud800"]`,
    );
  });

  it('accepts a null-prototype object and a value shared without a cycle', () => {
    const shared = { v: 1 };
    const bare = { k: shared };
    Reflect.setPrototypeOf(bare, null);
    expect(canonicalJson({ a: shared, b: bare })).toBe('{"a":{"v":1},"b":{"k":{"v":1}}}');
  });

  it.each([
    ['undefined', { a: undefined }, '$.a'],
    ['a function', { cb: () => 1 }, '$.cb'],
    ['a symbol', [Symbol('s')], '$[0]'],
    ['a bigint', { n: 1n }, '$.n'],
    ['NaN', { n: Number.NaN }, '$.n'],
    ['Infinity', [Number.POSITIVE_INFINITY], '$[0]'],
    ['a Date', { at: new Date(0) }, '$.at'],
    ['a Map', { m: new Map() }, '$.m'],
    ['a Set', { s: new Set() }, '$.s'],
    ['a typed array', { t: new Uint8Array(2) }, '$.t'],
    ['a class instance', { c: new (class Point { x = 1; })() }, '$.c'],
    ['an array hole', { h: holed }, '$.h'],
    ['an odd key', { 'a b': undefined }, '$["a b"]'],
  ])('rejects %s with its path', (_label, value, path) => {
    expect(rejection(value)).toEqual({ code: 'non-plain-value', path });
  });

  it('rejects cycles, symbol keys, accessors and non-enumerable properties', () => {
    const cycle: Record<string, unknown> = { a: 1 };
    cycle['self'] = cycle;
    expect(rejection(cycle)).toEqual({ code: 'non-plain-value', path: '$.self' });
    expect(rejection({ [Symbol('k')]: 1 })).toEqual({ code: 'non-plain-value', path: '$' });
    expect(rejection(Object.defineProperty({}, 'g', { get: () => 1, enumerable: true })))
      .toEqual({ code: 'non-plain-value', path: '$.g' });
    expect(rejection(Object.defineProperty({}, 'h', { value: 1, enumerable: false })))
      .toEqual({ code: 'non-plain-value', path: '$.h' });
  });

  it('names a path in the message without quoting the rejected value', () => {
    expect(() => canonicalJson({ secret: () => 'token-123' }))
      .toThrow('bijou-replay-event/1 non-plain-value at $.secret: a value of type function');
    expect(() => canonicalJson({ secret: () => 'token-123' })).not.toThrow('token-123');
  });
});
