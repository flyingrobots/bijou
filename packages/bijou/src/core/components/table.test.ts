import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext, auditStyle } from '../../adapters/test/index.js';

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

  it('renders a table in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = table({ columns, rows, ctx });
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('active');
    expect(result).toContain('─'); // table border chars
  });

  it('wraps fixed-width cell content by default', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = table({
      columns: [{ header: 'Status', width: 4 }],
      rows: [['degraded']],
      ctx,
    });

    expect(result).toContain('degr');
    expect(result).toContain('aded');
  });

  it('supports per-instance truncate overflow overrides', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = table({
      columns: [{ header: 'Status', width: 4 }],
      rows: [['degraded']],
      overflow: 'truncate',
      ctx,
    });

    expect(result).toContain('degr');
    expect(result).not.toContain('aded');
  });

  it('renders TSV in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = table({ columns, rows, ctx });
    const lines = result.split('\n');
    expect(lines[0]).toBe('Name\tStatus\tScore');
    expect(lines[1]).toBe('Alice\tactive\t95');
    expect(lines[2]).toBe('Bob\tpending\t72');
  });

  it('renders accessible format', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = table({ columns, rows, ctx });
    expect(result).toContain('Row 1: Name=Alice, Status=active, Score=95');
    expect(result).toContain('Row 2: Name=Bob, Status=pending, Score=72');
  });

  it('handles empty rows', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = table({ columns, rows: [], ctx });
    expect(result).toBe('Name\tStatus\tScore');
  });

  it('pads emoji-presentation dingbats so later columns stay aligned', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = table({
      columns: [
        { header: 'Name' },
        { header: 'Status' },
        { header: 'Count' },
      ],
      rows: [
        ['Alpha', 'ok', '1'],
        ['Beta', '❌', '2'],
        ['Gamma', '✅', '3'],
      ],
      ctx,
    });

    const lines = result.split('\n');
    expect(lines[3]).toBe('│ Alpha │ ok     │ 1     │');
    expect(lines[4]).toBe('│ Beta  │ ❌     │ 2     │');
    expect(lines[5]).toBe('│ Gamma │ ✅     │ 3     │');
  });

  describe('background fill', () => {
    it('applies headerBgToken', () => {
      const style = auditStyle();
      const ctx = createTestContext({ mode: 'interactive', style });
      table({ columns, rows, headerBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
      const bgCalls = style.calls.filter((c) => c.method === 'bgHex');
      expect(bgCalls.length).toBeGreaterThan(0);
      expect(bgCalls[0]!.color).toBe('#001122');
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
      expect(result).not.toMatch(/\u001b\[/);
    });
  });

  describe('defensive input handling', () => {
    it('handles empty columns gracefully', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = table({ columns: [], rows, ctx });
      expect(result).toContain('Alice\tactive\t95');
      expect(result).toContain('Bob\tpending\t72');
    });

    it('handles null/undefined fields in rows gracefully', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const badRows = [[null as any, undefined as any, 'value']];
      const result = table({ columns, rows: badRows, ctx });
      expect(result).toContain('Name\tStatus\tScore');
      expect(result).toContain('value');
      // Null/undefined fields should become empty strings in TSV
      const dataLine = result.split('\n').find(l => l.includes('value'))!;
      expect(dataLine).toMatch(/\t\tvalue$/);
    });
  });
});
