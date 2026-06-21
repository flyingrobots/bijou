import { describe, it, expect } from 'vitest';
import { flex } from './flex.js';

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
    expect(lines[0]?.trimEnd()).toBe('hello');
    expect(lines[3]?.trimEnd()).toBe('');
  });

  it('align end — content at bottom', () => {
    const result = flex(
      { direction: 'row', width: 10, height: 4 },
      { basis: 10, content: 'hello', align: 'end' },
    );
    const lines = result.split('\n');
    expect(lines[0]?.trimEnd()).toBe('');
    expect(lines[3]?.trimEnd()).toBe('hello');
  });

  it('align center — content in middle', () => {
    const result = flex(
      { direction: 'row', width: 10, height: 5 },
      { basis: 10, content: 'hi', align: 'center' },
    );
    const lines = result.split('\n');
    // 5 rows, 1 line content → 2 blank before, 1 content, 2 blank after
    expect(lines[2]?.trimEnd()).toBe('hi');
  });
});
