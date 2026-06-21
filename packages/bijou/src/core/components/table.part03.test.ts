import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.js';

function maxLineWidth(value: string): number {
  return Math.max(...value.split('\n').map(line => graphemeWidth(line)));
}

describe('table', () => {
  const rows = [
      ['Alice', 'active', '95'],
      ['Bob', 'pending', '72'],
    ];

  it('renders a markdown variant with alignment markers', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      expect(table({
        columns: [
          { header: 'Name' },
          { header: 'Status' },
          { header: 'Score', align: 'right' },
        ],
        rows,
        variant: 'markdown',
        ctx,
      })).toBe([
        '| Name  | Status  | Score |',
        '|-------|---------|------:|',
        '| Alice | active  |    95 |',
        '| Bob   | pending |    72 |',
      ].join('\n'));
    });

  it('renders a definition variant with inferred field/value columns', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      expect(table({
        variant: 'definition',
        rows: [
          ['PR', 'https://github.com/flyingrobots/bijou/pull/120'],
          ['State', 'MERGED'],
        ],
        ctx,
      })).toBe([
        'Field  Value',
        '━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'PR     https://github.com/flyingrobots/bijou/pull/120',
        '─────  ──────────────────────────────────────────────',
        'State  MERGED',
      ].join('\n'));
    });

  it('renders an expanded record-inspection variant', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = table({
        columns: [{ header: 'Name' }, { header: 'Status' }, { header: 'Score' }],
        rows: [['Alice', 'active', '95']],
        variant: 'expanded',
        ctx,
      });
      expect(maxLineWidth(result)).toBeLessThanOrEqual(ctx.runtime.columns);
      expect(result.split('\n')).toEqual([
        '-[ RECORD 1 ]' + '-'.repeat(ctx.runtime.columns - '-[ RECORD 1 ]'.length),
        'Name   | Alice',
        'Status | active',
        'Score  | 95',
      ]);
    });

  it('fits markdown and expanded variants to explicit narrow widths', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const narrowRows = [['Alpha', 'one two three four five six']];
      const narrowColumns = [
        { header: 'Name', minWidth: 4 },
        { header: 'Notes', minWidth: 5 },
      ];
      for (const variant of ['markdown', 'expanded'] as const) {
        const result = table({
          columns: narrowColumns,
          rows: narrowRows,
          variant,
          width: 20,
          ctx,
        });
        expect(maxLineWidth(result), variant).toBeLessThanOrEqual(20);
      }
      expect(table({
        columns: narrowColumns,
        rows: narrowRows,
        variant: 'expanded',
        width: 20,
        ctx,
      })).not.toContain('<br>');
    });

  it('fits expanded field labels and values to explicit narrow widths', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = table({
        columns: [{ header: 'Extremely long field name' }],
        rows: [['one two three four five six']],
        variant: 'expanded',
        width: 16,
        ctx,
      });
      expect(maxLineWidth(result)).toBeLessThanOrEqual(16);
      expect(result).toContain('one');
      expect(result).not.toContain('<br>');
    });

  it('escapes tabs, newlines, and backslashes in default TSV pipe output', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(table({
        columns: [{ header: 'Name' }, { header: 'Note' }],
        rows: [['A\tB', 'line\nbreak\\tail']],
        ctx,
      })).toBe('Name\tNote\nA\\tB\tline\\nbreak\\\\tail');
    });

  it('supports CSV pipe formatting with quoted cells', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(table({
        columns: [{ header: 'Name' }, { header: 'Note' }],
        rows: [
          ['Alice', 'hello, "world"'],
          ['Bob', 'line\nbreak'],
        ],
        pipeFormat: 'csv',
        ctx,
      })).toBe('Name,Note\nAlice,"hello, ""world"""\nBob,"line\nbreak"');
    });

  it('supports markdown pipe formatting with escaped cells', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(table({
        columns: [{ header: 'Name' }, { header: 'Note' }],
        rows: [['A|B', 'line\nbreak']],
        pipeFormat: 'markdown',
        ctx,
      })).toBe([
        '| Name | Note          |',
        '|------|---------------|',
        '| A\\|B | line<br>break |',
      ].join('\n'));
    });
});
