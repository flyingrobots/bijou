import { describe, it, expect } from 'vitest';
import { enumeratedList } from './enumerated-list.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('enumeratedList', () => {
  it('renders arabic style by default', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['First', 'Second', 'Third'], { ctx });
    expect(result).toContain('1. First');
    expect(result).toContain('2. Second');
    expect(result).toContain('3. Third');
  });

  it('renders alpha style', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Apples', 'Bananas', 'Cherries'], { style: 'alpha', ctx });
    expect(result).toContain('a. Apples');
    expect(result).toContain('b. Bananas');
    expect(result).toContain('c. Cherries');
  });

  it('renders roman style', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Setup', 'Build', 'Test', 'Deploy'], { style: 'roman', ctx });
    expect(result).toContain('i. Setup');
    expect(result).toContain('ii. Build');
    expect(result).toContain('iii. Test');
    expect(result).toContain('iv. Deploy');
  });

  it('renders bullet style with unicode bullet', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Milk', 'Eggs', 'Bread'], { style: 'bullet', ctx });
    expect(result).toContain('\u2022 Milk');
    expect(result).toContain('\u2022 Eggs');
    expect(result).toContain('\u2022 Bread');
  });

  it('renders dash style with en-dash', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Item A', 'Item B', 'Item C'], { style: 'dash', ctx });
    expect(result).toContain('\u2013 Item A');
    expect(result).toContain('\u2013 Item B');
    expect(result).toContain('\u2013 Item C');
  });

  it('renders none style with indented items and no prefix', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['One', 'Two', 'Three'], { style: 'none', ctx });
    expect(result).toBe('  One\n  Two\n  Three');
  });

  it('respects start offset', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Five', 'Six', 'Seven'], { style: 'arabic', start: 5, ctx });
    expect(result).toContain('5. Five');
    expect(result).toContain('6. Six');
    expect(result).toContain('7. Seven');
  });

  it('controls leading spaces with indent', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Item'], { indent: 4, ctx });
    expect(result).toBe('    1. Item');
  });

  it('right-aligns prefixes for consistent indentation with 10+ items', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const items = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);
    const result = enumeratedList(items, { ctx });
    const lines = result.split('\n');
    // ' 1.' has length 3 and '12.' has length 3, but ' 1.' is padded
    // With right-alignment: ' 1. Item 1' and '12. Item 12'
    expect(lines[0]).toMatch(/^\s+ 1\. Item 1$/);
    expect(lines[8]).toMatch(/^\s+ 9\. Item 9$/);
    expect(lines[9]).toMatch(/^\s+10\. Item 10$/);
  });

  it('uses ASCII fallback in pipe mode: * for bullet', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = enumeratedList(['Milk', 'Eggs'], { style: 'bullet', ctx });
    expect(result).toContain('* Milk');
    expect(result).toContain('* Eggs');
    expect(result).not.toContain('\u2022');
  });

  it('uses ASCII fallback in pipe mode: - for dash', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = enumeratedList(['Item A', 'Item B'], { style: 'dash', ctx });
    expect(result).toContain('- Item A');
    expect(result).toContain('- Item B');
    expect(result).not.toContain('\u2013');
  });

  it('uses simple numbering in accessible mode regardless of style', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = enumeratedList(['Alpha', 'Bravo', 'Charlie'], { style: 'roman', ctx });
    expect(result).toContain('1. Alpha');
    expect(result).toContain('2. Bravo');
    expect(result).toContain('3. Charlie');
    expect(result).not.toContain('i.');
  });

  it('returns empty string for empty items array', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(enumeratedList([], { ctx })).toBe('');
  });

  it('renders a single item correctly', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Only item'], { ctx });
    expect(result).toBe('  1. Only item');
  });

  it('handles multi-line items with continuation indentation', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = enumeratedList(['Line one\nLine two', 'Another'], { ctx });
    const lines = result.split('\n');
    expect(lines[0]).toBe('  1. Line one');
    expect(lines[1]).toBe('     Line two');
    expect(lines[2]).toBe('  2. Another');
  });

  it('works with default options (no options passed)', () => {
    // This test ensures the function doesn't crash without options
    // when no default context is set, it should still work (resolveCtx returns undefined)
    const result = enumeratedList(['A', 'B', 'C']);
    expect(result).toContain('1. A');
    expect(result).toContain('2. B');
    expect(result).toContain('3. C');
  });
});
