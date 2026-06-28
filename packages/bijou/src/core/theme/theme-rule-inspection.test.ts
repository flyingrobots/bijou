import { describe, expect, it } from 'vitest';
import { createTokenGraph } from './graph.js';
import { bestContrastWith, scope } from './theme-rules.js';

describe('theme rule inspection', () => {
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
});
