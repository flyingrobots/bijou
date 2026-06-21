import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.js';
import { must } from '@flyingrobots/bijou/adapters/test';

function maxLineWidth(value: string): number {
  return Math.max(...value.split('\n').map(line => graphemeWidth(line)));
}

describe('table', () => {
  const columns = [
      { header: 'Name' },
      { header: 'Status' },
      { header: 'Score' },
    ];

  const rows = [
      ['Alice', 'active', '95'],
      ['Bob', 'pending', '72'],
    ];

  it('fits default human-mode tables to the runtime width', () => {
      const ctx = createTestContext({
        mode: 'interactive',
        noColor: true,
        runtime: { columns: 24 },
      });
      const result = table({
        columns: [
          { header: 'Name', minWidth: 4 },
          { header: 'Why', minWidth: 10 },
        ],
        rows: [['alpha', 'one two three four five six']],
        ctx,
      });
      expect(maxLineWidth(result)).toBeLessThanOrEqual(24);
      expect(result).toContain('three four');
    });

  it('preserves content-sized layout when layout is intrinsic', () => {
      const ctx = createTestContext({
        mode: 'interactive',
        noColor: true,
        runtime: { columns: 24 },
      });
      const result = table({
        layout: 'intrinsic',
        columns: [
          { header: 'Name', minWidth: 4 },
          { header: 'Why', minWidth: 10 },
        ],
        rows: [['alpha', 'one two three four five six']],
        ctx,
      });
      expect(maxLineWidth(result)).toBeGreaterThan(24);
    });

  it('honors per-column maxWidth during fitting', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = table({
        layout: 'intrinsic',
        columns: [
          { header: 'Name' },
          { header: 'Details', maxWidth: 8 },
        ],
        rows: [['alpha', 'one two three four']],
        ctx,
      });
      expect(maxLineWidth(result)).toBeLessThanOrEqual(20);
      expect(result).toContain('one two');
      expect(result).toContain('three');
    });

  it('uses column weights when distributing constrained width', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = table({
        columns: [
          { header: 'A', minWidth: 4, weight: 1 },
          { header: 'B', minWidth: 4, weight: 3 },
        ],
        rows: [['alpha beta gamma delta', 'one two three four five six seven']],
        variant: 'header-rule',
        width: 26,
        ctx,
      });
      const rule = must(result.split('\n')[1]);
      const [left, right] = rule.split(/ {2}/);
      expect(left).toHaveLength(8);
      expect(right).toHaveLength(16);
      expect(maxLineWidth(result)).toBeLessThanOrEqual(26);
    });

  it('renders an ASCII grid variant', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      expect(table({ columns, rows, variant: 'ascii-grid', ctx })).toBe([
        '+-------+---------+-------+',
        '| Name  | Status  | Score |',
        '+-------+---------+-------+',
        '| Alice | active  | 95    |',
        '| Bob   | pending | 72    |',
        '+-------+---------+-------+',
      ].join('\n'));
    });

  it('renders a ruled variant with heavy header and light row rules', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      expect(table({ columns, rows, variant: 'ruled', ctx })).toBe([
        'Name   Status   Score',
        '━━━━━  ━━━━━━━  ━━━━━',
        'Alice  active   95',
        '─────  ───────  ─────',
        'Bob    pending  72',
      ].join('\n'));
    });

  it('renders a header-rule variant without row separators', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      expect(table({ columns, rows, variant: 'header-rule', ctx })).toBe([
        'Name   Status   Score',
        '-----  -------  -----',
        'Alice  active   95',
        'Bob    pending  72',
      ].join('\n'));
    });

  it('renders a plain aligned-column variant using spaces', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      expect(table({ columns, rows, variant: 'plain', ctx })).toBe([
        'Name   Status   Score',
        'Alice  active   95',
        'Bob    pending  72',
      ].join('\n'));
    });
});
