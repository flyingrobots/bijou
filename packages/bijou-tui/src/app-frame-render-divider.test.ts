import { createSurface } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { paintDivider } from './app-frame-render-surface.js';

describe('paintDivider', () => {
  it('preserves one-cell graphemes and rejects wide divider glyphs', () => {
    const rect = { row: 0, col: 0, width: 1, height: 1 };
    const target = createSurface(1, 1);

    paintDivider(target, rect, 'e\u0301', 'row');
    expect(target.get(0, 0).char).toBe('e\u0301');

    paintDivider(target, rect, '🧵', 'row');
    expect(target.get(0, 0).char).toBe('│');
  });
});
