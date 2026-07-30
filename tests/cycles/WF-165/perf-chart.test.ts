import { createSurface } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import {
  pushViewTime,
  renderBrailleLineChart,
} from '../../../examples/perf-gradient/perf-chart.js';

describe('performance chart', () => {
  it('right-aligns warm-up samples without repainting the reference color', () => {
    const surface = createSurface(4, 2);
    pushViewTime(2);

    renderBrailleLineChart(
      surface,
      0,
      0,
      4,
      2,
      4,
      '#00ff00',
      '#000000',
      '#444444',
      1,
    );

    expect(surface.get(0, 1)).toMatchObject({
      fg: '#444444',
      bg: '#000000',
    });
    expect(surface.get(3, 0)).toMatchObject({
      fg: '#00ff00',
      bg: '#000000',
    });
    expect(surface.get(3, 0).char).not.toBe(' ');
  });
});
