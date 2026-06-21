import { describe, it, expect } from 'vitest';
import { stringToSurface, type Surface } from '@flyingrobots/bijou';
import { createPagerStateForSurface, pagerSurface, pagerScrollBy } from './pager.js';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

function plainSurface(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

describe('pagerSurface', () => {
  it('renders surface content with a status line', () => {
    const content = stringToSurface(LONG_CONTENT, 20, 50);
    const state = createPagerStateForSurface(content, { width: 20, height: 5 });
    const output = pagerSurface(content, state);
    const lines = plainSurface(output).split('\n');

    expect(lines).toHaveLength(5);
    expect(lines[4]).toContain('Line 1/50');
  });

  it('status line updates with scroll position', () => {
    const content = stringToSurface(LONG_CONTENT, 20, 50);
    const state = pagerScrollBy(
      createPagerStateForSurface(content, { width: 20, height: 5 }),
      10,
    );
    const lines = plainSurface(pagerSurface(content, state)).split('\n');
    expect(lines[4]).toContain('Line 11/50');
  });

  it('renders without status line when showStatus is false', () => {
    const content = stringToSurface(LONG_CONTENT, 20, 50);
    const state = createPagerStateForSurface(content, { width: 20, height: 5 });
    const lines = plainSurface(pagerSurface(content, state, { showStatus: false })).split('\n');

    expect(lines).toHaveLength(5);
    expect(plainSurface(pagerSurface(content, state, { showStatus: false }))).not.toContain('Line');
  });

  it('supports overlay scrollbars for surface content', () => {
    const content = stringToSurface('abcde\nfghij\nklmno\npqrst', 5, 4);
    const state = createPagerStateForSurface(content, { width: 5, height: 3 });
    const lines = plainSurface(pagerSurface(content, state, {
      showStatus: false,
      showScrollbar: true,
      scrollbarMode: 'overlay',
    })).split('\n');

    expect(lines).toEqual(['abcd█', 'fghi█', 'klmn│']);
  });
});
