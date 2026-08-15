import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import {
  themeLabColumns,
  themeLabColumnWidth,
  themeLabRightColumnWidth,
} from '../../../examples/docs/app-theme-lab-columns.js';

describe('Theme Lab responsive columns', () => {
  it.each([30, 35, 52])('stacks both complete panels at %i columns', (bodyWidth) => {
    const leftWidth = themeLabColumnWidth(bodyWidth);
    const rightWidth = themeLabRightColumnWidth(bodyWidth);
    const left = createSurface(leftWidth, 2);
    const right = createSurface(rightWidth, 3);
    left.set(0, 1, { char: 'L' });
    right.set(rightWidth - 1, 2, { char: 'R' });

    const composed = themeLabColumns(left, right, bodyWidth);

    expect(leftWidth).toBeLessThanOrEqual(bodyWidth);
    expect(rightWidth).toBeLessThanOrEqual(bodyWidth);
    expect(composed.width).toBe(bodyWidth);
    expect(composed.height).toBe(6);
    expect(composed.get(0, 1).char).toBe('L');
    expect(composed.get(rightWidth - 1, 5).char).toBe('R');
  });

  it('keeps the wide layout side by side at the minimum fitting width', () => {
    const bodyWidth = 53;
    const leftWidth = themeLabColumnWidth(bodyWidth);
    const rightWidth = themeLabRightColumnWidth(bodyWidth);
    const composed = themeLabColumns(
      createSurface(leftWidth, 2),
      createSurface(rightWidth, 3),
      bodyWidth,
    );

    expect(leftWidth + 1 + rightWidth).toBeLessThanOrEqual(bodyWidth);
    expect(composed.height).toBe(3);
  });
});
