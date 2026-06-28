import { describe, expect, it } from 'vitest';
import { createTokenGraph } from './graph.js';
import { bestContrastWith, scope } from './theme-rules.js';

describe('theme rule inspection', () => {
  it('marks invalid resolved path candidates without aborting inspection', () => {
    const graph = createTokenGraph({
      palette: {
        broken: 'not-a-color',
        paper: '#ffffff',
      },
      surface: {
        canvas: { fg: '#ffffff', bg: '#000000' },
      },
      semantic: {
        primary: bestContrastWith({ ref: 'surface.canvas.bg' }, scope('palette')),
      },
    });

    expect(graph.get('semantic.primary').hex).toBe('#ffffff');
    const inspected = graph.inspect('semantic.primary');
    if (inspected.kind !== 'rule') throw new Error('Expected rule inspection.');
    expect(inspected.candidates.find(candidate => candidate.path === 'palette.broken')?.reasons).toContain('invalid');
  });

  it('includes mix transform references in rule dependencies', () => {
    const graph = createTokenGraph({
      palette: {
        ink: '#000000',
        paper: '#ffffff',
      },
      support: {
        tint: '#777777',
      },
      surface: {
        canvas: { fg: '#ffffff', bg: '#000000' },
      },
      semantic: {
        primary: bestContrastWith({
          ref: 'surface.canvas.bg',
          transform: [{ type: 'mix', with: 'support.tint', ratio: 0.5 }],
        }, scope('palette')),
      },
    });

    const inspected = graph.inspect('semantic.primary');
    if (inspected.kind !== 'rule') throw new Error('Expected rule inspection.');
    expect(inspected.dependencies).toEqual(expect.arrayContaining([
      'surface.canvas.bg',
      'support.tint',
    ]));
  });

  it('propagates circular candidate reference failures', () => {
    const graph = createTokenGraph({
      palette: {
        ok: '#ffffff',
      },
      semantic: {
        a: bestContrastWith('#000000', ['semantic.b', 'palette.ok']),
        b: { ref: 'semantic.a' },
      },
    });

    expect(() => graph.get('semantic.a')).toThrow(/Circular token reference/);
  });

  it('rejects invalid rule target colors', () => {
    const graph = createTokenGraph({
      palette: {
        ink: '#000000',
        paper: '#ffffff',
      },
      surface: {
        bad: 'not-a-color',
      },
      semantic: {
        primary: bestContrastWith({ ref: 'surface.bad' }, scope('palette')),
      },
    });

    expect(() => graph.get('semantic.primary')).toThrow(/invalid target color/);
  });
});
