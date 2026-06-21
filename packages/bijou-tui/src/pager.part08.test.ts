import { describe, it, expect } from 'vitest';
import { createPagerState, pager, pagerScrollBy } from './pager.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

// ── Render ─────────────────────────────────────────────────────────

describe('pager', () => {
  it('renders viewport with status line', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 20, height: 5 });
    const output = pager(state);
    const lines = output.split('\n');
    // 4 viewport lines + 1 status line = 5
    expect(lines).toHaveLength(5);
    expect(lines[4]).toContain('Line 1/50');
  });

  it('status line updates with scroll position', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 20, height: 5 }),
      10,
    );
    const output = pager(state);
    const lines = output.split('\n');
    expect(lines[4]).toContain('Line 11/50');
  });

  it('renders without status line when showStatus is false', () => {
    const state = createPagerState({ content: LONG_CONTENT, width: 20, height: 5 });
    const output = pager(state, { showStatus: false });
    const lines = output.split('\n');
    // Full viewport height, no status
    expect(lines).toHaveLength(5);
    expect(output).not.toContain('Line');
  });

  it('first visible line matches scroll position', () => {
    const state = pagerScrollBy(
      createPagerState({ content: LONG_CONTENT, width: 20, height: 5 }),
      3,
    );
    const output = pager(state);
    const lines = output.split('\n');
    expect(lines[0]).toContain('line 4');
  });

  it('supports overlay scrollbars without reserving a dead gutter column', () => {
    const state = createPagerState({
      content: 'abcde\nfghij\nklmno\npqrst',
      width: 5,
      height: 3,
    });
    const output = pager(state, { showStatus: false, showScrollbar: true, scrollbarMode: 'overlay' });

    expect(output.split('\n')).toEqual(['abcd█', 'fghi█', 'klmn│']);
  });
});
