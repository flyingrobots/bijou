import { describe, expect, it } from 'vitest';
import { createTokenGraph } from './graph.js';
import {
  bestContrastWith,
  closestColor,
  minContrastWith,
  mostVivid,
  nthColor,
  scope,
} from './theme-rules.js';

describe('theme rule selectors', () => {
  it('chooses the highest contrast candidate from a scope', () => {
    const graph = createTokenGraph({
      palette: {
        black: '#000000',
        gray: '#777777',
        white: '#ffffff',
      },
      surface: {
        canvas: { fg: '#ffffff', bg: '#000000' },
      },
      semantic: {
        primary: bestContrastWith({ ref: 'surface.canvas.bg' }, scope('palette')),
      },
    });

    expect(graph.get('semantic.primary').hex).toBe('#ffffff');
  });

  it('chooses the first candidate that clears a minimum contrast ratio', () => {
    const graph = createTokenGraph({
      palette: {
        weak: '#222222',
        pass: '#999999',
        stronger: '#ffffff',
      },
      surface: {
        canvas: { fg: '#ffffff', bg: '#000000' },
      },
      semantic: {
        muted: minContrastWith({ ref: 'surface.canvas.bg' }, scope('palette'), { ratio: 4.5 }),
      },
    });

    expect(graph.get('semantic.muted').hex).toBe('#999999');
  });

  it('keeps reserved roles out of vivid accent selection and explains rejection', () => {
    const graph = createTokenGraph({
      palette: {
        red: '#ff0000',
        green: '#00ff00',
        blue: '#3399ff',
        gray: '#777777',
      },
      surface: {
        canvas: { fg: '#ffffff', bg: '#000000' },
      },
      semantic: {
        accent: mostVivid(scope('palette'), {
          against: { ref: 'surface.canvas.bg' },
          minContrast: 4.5,
          not: ['palette.red', 'palette.green'],
        }),
      },
    });

    expect(graph.get('semantic.accent').hex).toBe('#3399ff');
    const inspected = graph.inspect('semantic.accent');
    if (inspected.kind !== 'rule') throw new Error('Expected rule inspection.');
    expect(inspected.selected?.path).toBe('palette.blue');
    expect(inspected.candidates.find(candidate => candidate.path === 'palette.red')?.reasons).toContain('excluded');
    expect(inspected.dependencies).toEqual(expect.arrayContaining([
      'surface.canvas.bg',
      'palette.red',
      'palette.green',
      'palette.blue',
      'palette.gray',
    ]));
  });

  it('supports deterministic ordered and closest-color selection', () => {
    const graph = createTokenGraph({
      ramp: {
        low: '#111111',
        mid: '#777777',
        high: '#eeeeee',
      },
      semantic: {
        ordered: nthColor(scope('ramp'), 0.5),
        close: closestColor('#777778', scope('ramp')),
      },
    });

    expect(graph.get('semantic.ordered').hex).toBe('#777777');
    expect(graph.get('semantic.close').hex).toBe('#777777');
  });

  it('keeps circular rule references deterministic', () => {
    const graph = createTokenGraph({
      semantic: {
        a: bestContrastWith({ ref: 'semantic.b' }, ['#000000', '#ffffff']),
        b: bestContrastWith({ ref: 'semantic.a' }, ['#000000', '#ffffff']),
      },
    });

    expect(() => graph.get('semantic.a')).toThrow(/Circular token reference/);
  });

  it('fails malformed candidate contracts with explicit paths', () => {
    const missingCandidate = createTokenGraph({
      palette: { ok: '#ffffff' },
      semantic: { bad: bestContrastWith('#000000', ['palette.missing']) },
    });
    const missingScope = createTokenGraph({
      semantic: { bad: bestContrastWith('#000000', scope('palette')) },
    });
    const missingExclusion = createTokenGraph({
      palette: { ok: '#ffffff' },
      semantic: {
        bad: mostVivid(scope('palette'), {
          against: '#000000',
          not: ['palette.missing'],
        }),
      },
    });
    const missingAgainst = createTokenGraph({
      palette: { ok: '#ffffff' },
      semantic: { bad: mostVivid(scope('palette'), { minContrast: 4.5 }) },
    });

    expect(() => missingCandidate.get('semantic.bad')).toThrow(/candidate path not found: palette\.missing/);
    expect(() => missingScope.get('semantic.bad')).toThrow(/candidate scope not found: palette/);
    expect(() => missingExclusion.get('semantic.bad')).toThrow(/exclusion path not found: palette\.missing/);
    expect(() => missingAgainst.get('semantic.bad')).toThrow(/requires "against"/);
  });
});
