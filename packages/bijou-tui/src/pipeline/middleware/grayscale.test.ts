import { describe, it, expect } from 'vitest';
import { grayscaleFilter } from './grayscale.js';
import { createSurface } from '@flyingrobots/bijou';

describe('grayscaleFilter', () => {
  it('converts colors to grayscale luminance', () => {
    const mw = grayscaleFilter();
    
    const targetSurface = createSurface(2, 1);
    // Red cell
    targetSurface.set(0, 0, { char: 'A', fg: '#ff0000', bg: '#000000' });
    // Blue cell
    targetSurface.set(1, 0, { char: 'B', fg: '#0000ff', bg: '#ffffff' });

    const state: any = { targetSurface };
    
    let called = false;
    mw(state, () => { called = true; });

    expect(called).toBe(true);

    // Red luminance is ~30% (#4c)
    expect(targetSurface.get(0, 0).fg).toBe('#4c4c4c');
    expect(targetSurface.get(0, 0).bg).toBe('#000000');

    // Blue luminance is ~11% (#1d)
    expect(targetSurface.get(1, 0).fg).toBe('#1d1d1d');
    expect(targetSurface.get(1, 0).bg).toBe('#ffffff');
  });
});
