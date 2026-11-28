import { createSurface, parseAnsiToSurface } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { applySurfaceBackground } from './app-frame-render-surface.js';

const FRAME = Object.freeze({ hex: '#e0e0e0', bg: '#101010' });

describe('applySurfaceBackground keeps wide graphemes intact (flyingrobots/bijou#859)', () => {
  it('leaves the continuation cell after a wide lead empty, as framed pane text produces it', () => {
    const surface = applySurfaceBackground(parseAnsiToSurface('漢x', 3, 1), FRAME);

    expect([0, 1, 2].map((x) => surface.get(x, 0).char)).toEqual(['漢', '', 'x']);
    expect(surface.get(1, 0).bg).toBe('#101010');
  });

  it('still fills a blank cell that follows a narrow cell with a space', () => {
    const surface = createSurface(2, 1);
    surface.set(0, 0, { char: 'a', empty: false });
    surface.set(1, 0, { char: '', empty: false });

    expect(applySurfaceBackground(surface, FRAME).get(1, 0).char).toBe(' ');
  });
});
