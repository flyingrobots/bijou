import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext, auditStyle } from '../../adapters/test/index.js';
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

  it('honors explicit width for markdown pipe formatting', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = table({
        columns: [
          { header: 'Name', minWidth: 4 },
          { header: 'Notes', minWidth: 5 },
        ],
        rows: [['Alpha', 'one two three four five six']],
        pipeFormat: 'markdown',
        width: 20,
        ctx,
      });
      expect(maxLineWidth(result)).toBeLessThanOrEqual(20);
    });

  it('supports ASCII grid pipe formatting as an explicit human-readable lowering', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(table({
        columns: [{ header: 'Name' }, { header: 'Score' }],
        rows: [['Alice', '95']],
        pipeFormat: 'ascii-grid',
        ctx,
      })).toBe([
        '+-------+-------+',
        '| Name  | Score |',
        '+-------+-------+',
        '| Alice | 95    |',
        '+-------+-------+',
      ].join('\n'));
    });

  describe('background fill', () => {
      it('applies headerBgToken', () => {
        const style = auditStyle();
        const ctx = createTestContext({ mode: 'interactive', style });
        table({ columns, rows, headerBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
        const bgCalls = style.calls.filter((c) => c.method === 'bgHex');
        expect(bgCalls.length).toBeGreaterThan(0);
        expect(bgCalls[0]?.color).toBe('#001122');
      });
      it('no default bg (opt-in only)', () => {
        const style = auditStyle();
        const ctx = createTestContext({ mode: 'interactive', style });
        table({ columns, rows, ctx });
        const bgCalls = style.calls.filter((c) => c.method === 'bgHex');
        expect(bgCalls.length).toBe(0);
      });
      it('skips headerBgToken in pipe mode', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = table({ columns, rows, headerBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
        const lines = result.split('\n');
        expect(lines[0]).toBe('Name\tStatus\tScore');
      });
      it('skips headerBgToken when noColor is true', () => {
        const ctx = createTestContext({ mode: 'interactive', noColor: true });
        const result = table({ columns, rows, headerBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
        expect(result).toContain('Name');
        expect(result.includes('\u001b[')).toBe(false);
      });
    });

  describe('defensive input handling', () => {
      it('does not emit blank header rows when columns are omitted', () => {
        const row = [['Alice', 'active']];
        expect(table({ rows: row, ctx: createTestContext({ mode: 'pipe' }) }))
          .toBe('Alice\tactive');
        expect(table({ rows: row, ctx: createTestContext({ mode: 'accessible' }) }))
          .toBe('Row 1: Column 1=Alice, Column 2=active');
        expect(table({
          rows: row,
          ctx: createTestContext({ mode: 'interactive', noColor: true }),
        })).toBe([
          '┌───────┬────────┐',
          '│ Alice │ active │',
          '└───────┴────────┘',
        ].join('\n'));
      });
      it('handles empty columns gracefully', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = table({ columns: [], rows, ctx });
        expect(result).toContain('Alice\tactive\t95');
        expect(result).toContain('Bob\tpending\t72');
      });
      it('handles null/undefined fields in rows gracefully', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const badRows = [[null, undefined, 'value']];
        const result = table({ columns, rows: badRows, ctx });
        expect(result).toContain('Name\tStatus\tScore');
        expect(result).toContain('value');
        const dataLine = must(result.split('\n').find(l => l.includes('value')));
        expect(dataLine).toMatch(/\t\tvalue$/);
      });
    });
});
