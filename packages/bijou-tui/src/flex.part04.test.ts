import { describe, it, expect } from 'vitest';
import { flex } from './flex.js';

// ---------------------------------------------------------------------------
// Auto-sizing
// ---------------------------------------------------------------------------

describe('auto-sizing from content', () => {
  it('measures string width in row mode', () => {
    const widths: number[] = [];
    flex(
      { direction: 'row', width: 50, height: 1 },
      { content: 'short' },                    // auto: 5 cols
      { flex: 1, content: (w) => { widths.push(w); return ''; } },
    );
    expect(widths[0]).toBe(45); // 50 - 5 = 45
  });

  it('measures string height in column mode', () => {
    const heights: number[] = [];
    flex(
      { direction: 'column', width: 20, height: 10 },
      { content: 'a\nb\nc' },                  // auto: 3 rows
      { flex: 1, content: (_w, h) => { heights.push(h); return ''; } },
    );
    expect(heights[0]).toBe(7); // 10 - 3 = 7
  });
});
