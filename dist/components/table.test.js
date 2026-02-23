import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { table } from './table.js';
import { _resetThemeForTesting } from '../theme/resolve.js';
describe('table', () => {
    const originalEnv = { ...process.env };
    const originalIsTTY = process.stdout.isTTY;
    beforeEach(() => {
        _resetThemeForTesting();
        delete process.env['BIJOU_ACCESSIBLE'];
        delete process.env['NO_COLOR'];
        delete process.env['CI'];
        delete process.env['TERM'];
        delete process.env['BIJOU_THEME'];
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    });
    afterEach(() => {
        process.env = { ...originalEnv };
        Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
        _resetThemeForTesting();
    });
    const columns = [
        { header: 'Name' },
        { header: 'Status' },
        { header: 'Score' },
    ];
    const rows = [
        ['Alice', 'active', '95'],
        ['Bob', 'pending', '72'],
    ];
    it('renders a cli-table3 table in interactive mode', () => {
        const result = table({ columns, rows });
        expect(result).toContain('Alice');
        expect(result).toContain('Bob');
        expect(result).toContain('active');
        expect(result).toContain('─'); // table border chars
    });
    it('renders TSV in pipe mode', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
        const result = table({ columns, rows });
        const lines = result.split('\n');
        expect(lines[0]).toBe('Name\tStatus\tScore');
        expect(lines[1]).toBe('Alice\tactive\t95');
        expect(lines[2]).toBe('Bob\tpending\t72');
    });
    it('renders accessible format', () => {
        process.env['BIJOU_ACCESSIBLE'] = '1';
        const result = table({ columns, rows });
        expect(result).toContain('Row 1: Name=Alice, Status=active, Score=95');
        expect(result).toContain('Row 2: Name=Bob, Status=pending, Score=72');
    });
    it('handles empty rows', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
        const result = table({ columns, rows: [] });
        expect(result).toBe('Name\tStatus\tScore');
    });
});
//# sourceMappingURL=table.test.js.map