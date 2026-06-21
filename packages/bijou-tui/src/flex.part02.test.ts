import { describe, it, expect } from 'vitest';
import { flex } from './flex.js';

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
    // Padded to totalHeight
    expect(lines).toHaveLength(10);
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
    // 2 + 1 gap + 2 = 5 content lines, padded to totalHeight 10
    expect(lines).toHaveLength(10);
    expect(lines[0]).toContain('top');
    expect(lines[2]?.trim()).toBe(''); // gap row is blank
    expect(lines[3]).toContain('bot');
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
