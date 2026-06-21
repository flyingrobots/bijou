import { describe, it, expect } from 'vitest';
import { flex } from './flex.js';

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
