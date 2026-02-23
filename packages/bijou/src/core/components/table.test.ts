import { describe, it, expect } from 'vitest';
import { table } from './table.js';
import { createTestContext } from '../../adapters/test/index.js';

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
});
