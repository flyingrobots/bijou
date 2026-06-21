import { describe, it, expect } from 'vitest';
import { createTestContext, expectNoAnsi } from '../adapters/test/index.js';
import { box, headerBox } from './components/box.js';
import { table } from './components/table.js';
import { progressBar } from './components/progress.js';
import { spinnerFrame } from './components/spinner.js';
import { select } from './forms/select.js';

describe('environment integration', () => {
  describe('piped / non-interactive output', () => {
      it('box() returns content only, no border chars', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = box('hello world', { ctx });
        expect(result).toBe('hello world');
        expect(result).not.toMatch(/[┌┐└┘│─]/);
      });

      it('headerBox() returns label + detail as plain text', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = headerBox('Status', { detail: 'All good', ctx });
        expect(result).toContain('Status');
        expect(result).toContain('All good');
        expect(result).not.toMatch(/[┌┐└┘│─]/);
      });

      it('table() outputs TSV format', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = table({
          columns: [{ header: 'Name' }, { header: 'Age' }],
          rows: [['Alice', '30'], ['Bob', '25']],
          ctx,
        });
        const lines = result.split('\n');
        expect(lines[0]).toBe('Name\tAge');
        expect(lines[1]).toBe('Alice\t30');
        expect(lines[2]).toBe('Bob\t25');
        expect(result).not.toMatch(/[┌┐└┘│─]/);
      });

      it('progressBar() outputs percentage text', () => {
        const ctx = createTestContext({ mode: 'pipe' });
        const result = progressBar(50, { ctx });
        expect(result).toBe('Progress: 50%');
      });

      it('select() renders numbered list in pipe mode', async () => {
        const ctx = createTestContext({
          mode: 'pipe',
          io: { answers: ['2'] },
        });
        const result = await select({
          title: 'Pick a color',
          options: [
            { label: 'Red', value: 'red' },
            { label: 'Green', value: 'green' },
          ],
          ctx,
        });
        expect(result).toBe('green');
        expect(ctx.io.written.join('')).toContain('1.');
        expect(ctx.io.written.join('')).toContain('2.');
      });
    });

  describe('accessible mode', () => {
      it('box() returns content only', () => {
        const ctx = createTestContext({ mode: 'accessible' });
        const result = box('important info', { ctx });
        expect(result).toBe('important info');
        expect(result).not.toMatch(/[┌┐└┘│─]/);
      });

      it('table() uses row-label format', () => {
        const ctx = createTestContext({ mode: 'accessible' });
        const result = table({
          columns: [{ header: 'Name' }, { header: 'Age' }],
          rows: [['Alice', '30']],
          ctx,
        });
        expect(result).toContain('Row 1');
        expect(result).toContain('Name=Alice');
        expect(result).toContain('Age=30');
      });

      it('spinnerFrame() returns static text indicator', () => {
        const ctx = createTestContext({ mode: 'accessible' });
        const result = spinnerFrame(0, { label: 'Loading', ctx });
        expect(result).toBe('Loading. Please wait.');
      });
    });

  describe('TERM=dumb', () => {
      it('box output contains no ANSI codes', () => {
        const ctx = createTestContext({
          mode: 'pipe',
          runtime: { env: { TERM: 'dumb' } },
        });
        const result = box('test content', { ctx });
        expectNoAnsi(result);
        expect(result).toContain('test content');
      });
    });
});
