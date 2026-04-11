import { describe, it, expect } from 'vitest';
import { statsPanelSurface } from './stats-panel.js';
import { createTestContext } from '../../adapters/test/index.js';

const ctx = createTestContext();

describe('statsPanelSurface', () => {
  it('renders a panel with the requested width', () => {
    const surface = statsPanelSurface(
      [{ label: 'FPS', value: '30' }],
      { width: 20, ctx },
    );
    expect(surface.width).toBe(20);
  });

  it('renders multiple entries', () => {
    const surface = statsPanelSurface(
      [
        { label: 'FPS', value: '30' },
        { label: 'frame', value: '148' },
        { label: 'heap', value: '42 MB' },
      ],
      { width: 25, ctx },
    );
    // Box has 2 border rows + 3 content rows.
    expect(surface.height).toBe(5);
  });

  it('renders with a title', () => {
    const surface = statsPanelSurface(
      [{ label: 'fps', value: '60' }],
      { width: 20, title: 'Perf', ctx },
    );
    // Title should appear in the top border row.
    let topRow = '';
    for (let x = 0; x < surface.width; x++) {
      topRow += surface.get(x, 0).char;
    }
    expect(topRow).toContain('Perf');
  });

  it('handles empty entries', () => {
    const surface = statsPanelSurface([], { width: 20, ctx });
    // Should still return a valid surface (empty box).
    expect(surface.width).toBe(20);
    expect(surface.height).toBeGreaterThan(0);
  });

  it('includes inline sparkline when provided', () => {
    const surface = statsPanelSurface(
      [{ label: 'fps', value: '30', sparkline: [10, 20, 30, 40, 50] }],
      { width: 30, ctx },
    );
    // The row should contain block characters from the sparkline.
    let row = '';
    for (let x = 0; x < surface.width; x++) {
      row += surface.get(x, 1).char; // row 1 = first content row (row 0 = top border)
    }
    // Should contain at least one sparkline block char.
    expect(row).toMatch(/[▁▂▃▄▅▆▇█]/);
  });
});
