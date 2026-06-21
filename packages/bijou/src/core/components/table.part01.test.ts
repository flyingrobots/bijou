import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext } from '../../adapters/test/index.js';

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
});
