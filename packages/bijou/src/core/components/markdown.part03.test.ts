import { describe, it, expect } from 'vitest';
import { markdown } from './markdown.js';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';

function ctx(mode: 'interactive' | 'pipe' | 'accessible' = 'interactive', width = 80) {
  return createTestContext({ mode, runtime: { columns: width } });
}

describe('markdown()', () => {
  describe('width wrapping', () => {
      it('wraps long paragraphs to specified width', () => {
        const longText = 'word '.repeat(20).trim();
        const result = markdown(longText, { ctx: ctx('pipe'), width: 30 });
        const lines = result.split('\n');
        for (const line of lines) {
          expect(line.length).toBeLessThanOrEqual(30);
        }
      });

      it('uses ctx.runtime.columns as default width', () => {
        const c = ctx('pipe', 40);
        const longText = 'word '.repeat(20).trim();
        const result = markdown(longText, { ctx: c });
        const lines = result.split('\n');
        for (const line of lines) {
          expect(line.length).toBeLessThanOrEqual(40);
        }
      });

      it('sanitizes non-finite and fractional widths', () => {
        const result = markdown('word '.repeat(12).trim(), {
          ctx: ctx('pipe', 18),
          width: Number.NaN,
        });
        const fractional = markdown('word '.repeat(12).trim(), {
          ctx: ctx('pipe', 40),
          width: 9.9,
        });

        for (const line of result.split('\n')) expect(line.length).toBeLessThanOrEqual(18);
        for (const line of fractional.split('\n')) expect(line.length).toBeLessThanOrEqual(9);
      });

      it('wraps paragraphs by visible inline width instead of raw markdown markers', () => {
        const result = stripAnsi(markdown('alpha **beta** gamma', { ctx: ctx(), width: 10 }));
        expect(result.split('\n')).toEqual(['alpha beta', 'gamma']);
      });

      it('wraps linked inline text by visible width instead of OSC 8 control bytes', () => {
        const result = stripAnsi(markdown('alpha [beta](https://example.com) gamma', { ctx: ctx(), width: 10 }));
        expect(result.split('\n')).toEqual(['alpha beta', 'gamma']);
      });
    });

  describe('width validation', () => {
      it('negative width does not crash on HR in interactive mode', () => {
        // separator().repeat(negative) throws RangeError without validation
        const result = markdown('---', { ctx: ctx(), width: -10 });
        expect(typeof result).toBe('string');
      });

      it('width=0 does not crash on HR in interactive mode', () => {
        const result = markdown('---', { ctx: ctx(), width: 0 });
        expect(typeof result).toBe('string');
      });

      it('NaN width does not crash', () => {
        const result = markdown('Hello world\n\n---', { ctx: ctx(), width: NaN });
        expect(result).toContain('Hello');
      });
    });

  describe('edge cases', () => {
      it('returns empty string for empty input', () => {
        expect(markdown('', { ctx: ctx() })).toBe('');
      });

      it('returns empty string for whitespace-only input', () => {
        expect(markdown('   \n  \n  ', { ctx: ctx() })).toBe('');
      });

      it('handles mixed content', () => {
        const source = [
          '# Title',
          '',
          'A **bold** paragraph with `code`.',
          '',
          '- Item 1',
          '- Item 2',
          '',
          '---',
          '',
          '> A quote',
        ].join('\n');
        const result = markdown(source, { ctx: ctx('pipe') });
        expect(result).toContain('# Title');
        expect(result).toContain('bold');
        expect(result).toContain('code');
        expect(result).toContain('- Item 1');
        expect(result).toContain('---');
        expect(result).toContain('> A quote');
      });

      it('recognizes a table immediately after a paragraph without a blank line', () => {
        const source = [
          'Lead text',
          '| Name | Role |',
          '| :--- | :--- |',
          '| README.md | Front door |',
        ].join('\n');

        const result = markdown(source, { ctx: ctx('pipe') });
        expect(result).toContain('Lead text');
        expect(result).toContain('Name\tRole');
        expect(result).toContain('README.md\tFront door');
      });

      it('handles nested inline formatting', () => {
        const result = markdown('This has **bold and `code`** inside.', { ctx: ctx('pipe') });
        expect(result).toContain('bold and code');
      });

      it('handles null/undefined input gracefully', () => {
        expect(markdown(null, { ctx: ctx() })).toBe('');
        expect(markdown(undefined, { ctx: ctx() })).toBe('');
      });
    });

  describe('static mode', () => {
      it('renders styled output same as interactive (not plain like pipe)', () => {
        const c = createTestContext({ mode: 'static', runtime: { columns: 80 } });
        const result = markdown('**bold** and *italic*', { ctx: c });
        // Static mode applies styled() calls (same path as interactive)
        expect(result).toContain('bold');
        expect(result).toContain('italic');
        // Markers are stripped (not raw markdown)
        expect(result).not.toContain('**');
        expect(result).not.toContain('*italic*');
      });
    });
});
