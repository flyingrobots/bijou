import { describe, it, expect } from 'vitest';
import { accordion } from './accordion.js';
import { createTestContext } from '../../adapters/test/index.js';

const sections: Parameters<typeof accordion>[0] = [
  { title: 'Section A', content: 'Content A', expanded: true },
  { title: 'Section B', content: 'Content B' },
  { title: 'Section C', content: 'Content C', expanded: true },
];

describe('accordion', () => {
  it('renders expanded/collapsed indicators in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = accordion(sections, { ctx });
    expect(result).toContain('▼ Section A');
    expect(result).toContain('  Content A');
    expect(result).toContain('▶ Section B');
    expect(result).not.toContain('Content B\n');
    expect(result).toContain('▼ Section C');
  });

  it('renders expanded/collapsed indicators in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = accordion(sections, { ctx });
    expect(result).toContain('▼ Section A');
    expect(result).toContain('▶ Section B');
  });

  it('shows all sections as markdown headings in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = accordion(sections, { ctx });
    expect(result).toContain('# Section A\nContent A');
    expect(result).toContain('# Section B\nContent B');
    expect(result).toContain('# Section C\nContent C');
  });

  it('renders bracketed state labels in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = accordion(sections, { ctx });
    expect(result).toContain('[expanded] Section A: Content A');
    expect(result).toContain('[collapsed] Section B');
    expect(result).toContain('[expanded] Section C: Content C');
  });

  it('handles all collapsed sections', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const collapsed = [
      { title: 'A', content: 'a' },
      { title: 'B', content: 'b' },
    ];
    const result = accordion(collapsed, { ctx });
    expect(result).toContain('▶ A');
    expect(result).toContain('▶ B');
    expect(result).not.toContain('  a');
  });

  it('handles empty array', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(accordion([], { ctx })).toBe('');
  });

  it('indents multiline content', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const multi = [{ title: 'Multi', content: 'line1\nline2', expanded: true }];
    const result = accordion(multi, { ctx });
    expect(result).toContain('  line1\n  line2');
  });
});
