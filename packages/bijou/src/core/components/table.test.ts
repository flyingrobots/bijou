import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext, auditStyle } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.js';
import { must } from '@flyingrobots/bijou/adapters/test';
function maxLineWidth(value: string): number {
  return Math.max(...value.split('\n').map(line => graphemeWidth(line)));
}
const OSC8_OPEN = '\x1b]8;;https://example.test\x1b\\';
const OSC8_CLOSE = '\x1b]8;;\x1b\\';
function expectOpenedOsc8LinksClosed(value: string): void {
  for (const line of value.split('\n')) {
    if (line.includes(OSC8_OPEN)) {
      expect(line).toContain(OSC8_CLOSE);
    }
  }
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
  it('renders a table in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = table({ columns, rows, ctx });
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('active');
    expect(result).toContain('─'); // table border chars
  });
  it('supports the common shorthand call shape', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = table(columns, rows, ctx);
    expect(result).toBe([
      'Name\tStatus\tScore',
      'Alice\tactive\t95',
      'Bob\tpending\t72',
    ].join('\n'));
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
  it('closes OSC 8 hyperlinks when constrained cells truncate or wrap', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const linkedWords = `${OSC8_OPEN}alpha beta gamma${OSC8_CLOSE}`;
    const linkedToken = `${OSC8_OPEN}alphabetagamma${OSC8_CLOSE}`;
    expectOpenedOsc8LinksClosed(table({
      columns: [{ header: 'Link', width: 6 }],
      rows: [[linkedWords]],
      ctx,
    }));
    expectOpenedOsc8LinksClosed(table({
      columns: [{ header: 'Link', width: 6 }],
      rows: [[linkedToken]],
      wrap: 'grapheme',
      ctx,
    }));
    expectOpenedOsc8LinksClosed(table({
      columns: [{ header: 'Link', width: 6 }],
      rows: [[linkedToken]],
      overflow: 'truncate',
      ctx,
    }));
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
      expect(result).not.toMatch(/\u001b\[/);
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
      const badRows = [[null as any, undefined as any, 'value']];
      const result = table({ columns, rows: badRows, ctx });
      expect(result).toContain('Name\tStatus\tScore');
      expect(result).toContain('value');
      const dataLine = must(result.split('\n').find(l => l.includes('value')));
      expect(dataLine).toMatch(/\t\tvalue$/);
    });
  });
});
