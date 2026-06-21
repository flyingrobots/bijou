import { describe, it, expect } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { flex } from './flex.js';

const ANSI_SGR_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Count visible (non-ANSI) characters in a line. */
function visWidth(s: string): number {
  return s.replace(ANSI_SGR_PATTERN, '').length;
}

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
    const line = must(result.split('\n')[0]);
    expect(visWidth(line)).toBeLessThanOrEqual(10);
  });
});
