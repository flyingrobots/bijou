import { describe, expect, it } from 'vitest';
import { refusalsOfSlides, slidesOfPart } from './app-cell-widths.test-support.js';

describe('the components and hero apps paint only what the canvas contract takes', () => {
  it('every Components library slide, with its info, in each output mode', async () => {
    expect(await refusalsOfSlides(slidesOfPart(1))).toEqual([]);
  }, 120_000);
});
