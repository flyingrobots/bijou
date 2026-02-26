import { describe, it, expect } from 'vitest';
import { flex } from './flex.js';

/** Count visible (non-ANSI) characters in a line. */
function visWidth(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

// ---------------------------------------------------------------------------
// Row direction
// ---------------------------------------------------------------------------

describe('flex row', () => {
  it('distributes fixed-basis children', () => {
    const result = flex(
      { direction: 'row', width: 40, height: 3 },
      { basis: 10, content: 'left' },
      { basis: 10, content: 'right' },
    );
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    // First line should contain both words
    expect(lines[0]).toContain('left');
    expect(lines[0]).toContain('right');
  });

  it('flex children fill remaining space', () => {
    const widths: number[] = [];
    flex(
      { direction: 'row', width: 80, height: 1 },
      { basis: 20, content: 'sidebar' },
      { flex: 1, content: (w) => { widths.push(w); return 'main'; } },
    );
    expect(widths[0]).toBe(60); // 80 - 20 = 60
  });

  it('multiple flex children share proportionally', () => {
    const sizes: number[] = [];
    flex(
      { direction: 'row', width: 90, height: 1 },
      { flex: 1, content: (w) => { sizes.push(w); return ''; } },
      { flex: 2, content: (w) => { sizes.push(w); return ''; } },
    );
    expect(sizes[0]).toBe(30); // 1/3 of 90
    expect(sizes[1]).toBe(60); // 2/3 of 90
  });

  it('respects gap between children', () => {
    const widths: number[] = [];
    flex(
      { direction: 'row', width: 82, height: 1, gap: 2 },
      { flex: 1, content: (w) => { widths.push(w); return ''; } },
      { flex: 1, content: (w) => { widths.push(w); return ''; } },
    );
    // 82 - 2 (gap) = 80, split 50/50 = 40 each
    expect(widths[0]).toBe(40);
    expect(widths[1]).toBe(40);
  });

  it('respects minSize constraint', () => {
    const widths: number[] = [];
    flex(
      { direction: 'row', width: 30, height: 1 },
      { flex: 1, minSize: 25, content: (w) => { widths.push(w); return ''; } },
      { flex: 1, content: (w) => { widths.push(w); return ''; } },
    );
    expect(widths[0]).toBe(25); // clamped to min
  });

  it('respects maxSize constraint', () => {
    const widths: number[] = [];
    flex(
      { direction: 'row', width: 100, height: 1 },
      { flex: 1, maxSize: 30, content: (w) => { widths.push(w); return ''; } },
      { flex: 1, content: (w) => { widths.push(w); return ''; } },
    );
    expect(widths[0]).toBe(30); // clamped to max
  });

  it('pads output to exact height', () => {
    const result = flex(
      { direction: 'row', width: 20, height: 5 },
      { basis: 10, content: 'short' },
    );
    const lines = result.split('\n');
    expect(lines).toHaveLength(5);
  });

  it('renders content with allocated dimensions', () => {
    let receivedH = 0;
    flex(
      { direction: 'row', width: 40, height: 10 },
      { flex: 1, content: (_w, h) => { receivedH = h; return ''; } },
    );
    expect(receivedH).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Column direction
// ---------------------------------------------------------------------------

describe('flex column', () => {
  it('stacks children vertically with fixed basis', () => {
    const result = flex(
      { direction: 'column', width: 20, height: 10 },
      { basis: 1, content: 'header' },
      { basis: 1, content: 'footer' },
    );
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('header');
    expect(lines[1]).toContain('footer');
  });

  it('flex children fill remaining height', () => {
    const heights: number[] = [];
    flex(
      { direction: 'column', width: 40, height: 24 },
      { basis: 1, content: 'header' },
      { flex: 1, content: (_w, h) => { heights.push(h); return ''; } },
      { basis: 1, content: 'footer' },
    );
    expect(heights[0]).toBe(22); // 24 - 1 - 1 = 22
  });

  it('column gap inserts blank rows between sections', () => {
    const result = flex(
      { direction: 'column', width: 10, height: 10, gap: 1 },
      { basis: 2, content: 'top\ntop' },
      { basis: 2, content: 'bot\nbot' },
    );
    const lines = result.split('\n');
    // 2 + 1 gap + 2 = 5 lines
    expect(lines).toHaveLength(5);
  });

  it('renders content with full width', () => {
    let receivedW = 0;
    flex(
      { direction: 'column', width: 60, height: 24 },
      { flex: 1, content: (w) => { receivedW = w; return ''; } },
    );
    expect(receivedW).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// Cross-axis alignment
// ---------------------------------------------------------------------------

describe('cross-axis alignment (row)', () => {
  it('align start (default) — content at top', () => {
    const result = flex(
      { direction: 'row', width: 10, height: 4 },
      { basis: 10, content: 'hello', align: 'start' },
    );
    const lines = result.split('\n');
    expect(lines[0]!.trimEnd()).toBe('hello');
    expect(lines[3]!.trimEnd()).toBe('');
  });

  it('align end — content at bottom', () => {
    const result = flex(
      { direction: 'row', width: 10, height: 4 },
      { basis: 10, content: 'hello', align: 'end' },
    );
    const lines = result.split('\n');
    expect(lines[0]!.trimEnd()).toBe('');
    expect(lines[3]!.trimEnd()).toBe('hello');
  });

  it('align center — content in middle', () => {
    const result = flex(
      { direction: 'row', width: 10, height: 5 },
      { basis: 10, content: 'hi', align: 'center' },
    );
    const lines = result.split('\n');
    // 5 rows, 1 line content → 2 blank before, 1 content, 2 blank after
    expect(lines[2]!.trimEnd()).toBe('hi');
  });
});

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

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('empty children produces empty string', () => {
    const result = flex({ direction: 'row', width: 40, height: 5 });
    expect(result).toBe('');
  });

  it('single child fills the space', () => {
    const widths: number[] = [];
    flex(
      { direction: 'row', width: 40, height: 1 },
      { flex: 1, content: (w) => { widths.push(w); return ''; } },
    );
    expect(widths[0]).toBe(40);
  });

  it('handles zero flex total gracefully', () => {
    // All basis, no flex children — shouldn't crash
    const result = flex(
      { direction: 'row', width: 40, height: 1 },
      { basis: 10, content: 'a' },
      { basis: 10, content: 'b' },
    );
    expect(result).toBeDefined();
  });

  it('clips content wider than allocated space', () => {
    const result = flex(
      { direction: 'row', width: 10, height: 1 },
      { basis: 5, content: 'toolongword' },
    );
    const line = result.split('\n')[0]!;
    expect(visWidth(line)).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// Resize scenario
// ---------------------------------------------------------------------------

describe('resize reflow', () => {
  it('produces different layouts for different widths', () => {
    const renderApp = (width: number, height: number): string =>
      flex(
        { direction: 'row', width, height, gap: 1 },
        { basis: 15, content: 'sidebar' },
        { flex: 1, content: (w) => `main(${w})` },
      );

    const wide = renderApp(80, 24);
    const narrow = renderApp(40, 24);

    // Wide should allocate more to main
    expect(wide).toContain('main(64)');   // 80 - 15 - 1 gap
    expect(narrow).toContain('main(24)'); // 40 - 15 - 1 gap
  });
});
