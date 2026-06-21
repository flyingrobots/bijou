import { describe, it, expect } from 'vitest';
import { markdown } from './markdown.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth, stripAnsi } from '../text/grapheme.js';

function ctx(mode: 'interactive' | 'pipe' | 'accessible' = 'interactive', width = 80) {
  return createTestContext({ mode, runtime: { columns: width } });
}

describe('markdown()', () => {
  describe('tables', () => {
      const source = [
        '| Surface | Role |',
        '| :--- | :--- |',
        '| README.md | Public front door |',
        '| GUIDE.md | Fast path |',
      ].join('\n');

      it('renders GFM-style tables with boxed output in interactive mode', () => {
        const result = markdown(source, { ctx: ctx() });
        expect(result).toContain('README.md');
        expect(result).toContain('Public front door');
        expect(result).toContain('\u250c');
        expect(result).not.toContain('| :--- | :--- |');
      });

      it('lowers markdown tables to TSV in pipe mode', () => {
        const result = markdown(source, { ctx: ctx('pipe') });
        expect(result).toContain('Surface\tRole');
        expect(result).toContain('README.md\tPublic front door');
        expect(result).not.toContain('| :--- | :--- |');
      });

      it('linearizes markdown tables in accessible mode', () => {
        const result = markdown(source, { ctx: ctx('accessible') });
        expect(result).toContain('Row 1: Surface=README.md, Role=Public front door');
        expect(result).toContain('Row 2: Surface=GUIDE.md, Role=Fast path');
      });

      it('fits interactive markdown tables within the requested width', () => {
        const result = markdown(source, { ctx: ctx(), width: 20 });
        for (const line of result.split('\n')) {
          expect(graphemeWidth(stripAnsi(line))).toBeLessThanOrEqual(20);
        }
      });
    });

  describe('code blocks', () => {
      it('renders code block content', () => {
        const source = '```js\nconsole.log("hi");\n```';
        const result = markdown(source, { ctx: ctx() });
        expect(result).toContain('console.log("hi");');
      });

      it('preserves code block in pipe mode', () => {
        const source = '```\ncode\n```';
        const result = markdown(source, { ctx: ctx('pipe') });
        expect(result).toContain('```');
        expect(result).toContain('code');
      });

      it('handles empty code block', () => {
        const source = '```\n```';
        const result = markdown(source, { ctx: ctx() });
        // Should not crash
        expect(typeof result).toBe('string');
      });
    });

  describe('horizontal rules', () => {
      it('renders hr with dashes', () => {
        const result = markdown('---', { ctx: ctx() });
        expect(result).toContain('\u2500');
      });

      it('renders hr with asterisks', () => {
        const result = markdown('***', { ctx: ctx() });
        expect(result).toContain('\u2500');
      });

      it('renders hr in pipe mode', () => {
        const result = markdown('---', { ctx: ctx('pipe') });
        expect(result).toContain('---');
      });

      it('renders spaced asterisk HR (* * *)', () => {
        const result = markdown('* * *', { ctx: ctx() });
        expect(result).toContain('\u2500');
      });

      it('renders spaced dash HR (- - -)', () => {
        const result = markdown('- - -', { ctx: ctx() });
        expect(result).toContain('\u2500');
      });
    });

  describe('links', () => {
      it('renders link in interactive mode as hyperlink', () => {
        const result = markdown('[Click](https://example.com)', { ctx: ctx() });
        expect(result).toContain('Click');
        // Verify OSC 8 hyperlink escape is present
        expect(result).toContain('\x1b]8;');
      });

      it('renders link in pipe mode as text (url)', () => {
        const result = markdown('[Click](https://example.com)', { ctx: ctx('pipe') });
        expect(result).toContain('Click');
        expect(result).toContain('https://example.com');
      });

      it('renders link in accessible mode with Link: prefix', () => {
        const result = markdown('[Docs](https://docs.com)', { ctx: ctx('accessible') });
        expect(result).toContain('Link: Docs (https://docs.com)');
      });
    });

  describe('blockquotes', () => {
      it('renders blockquote with pipe character', () => {
        const result = markdown('> This is a quote', { ctx: ctx() });
        expect(result).toContain('This is a quote');
        expect(result).toContain('\u2502');
      });

      it('renders blockquote in pipe mode with > prefix', () => {
        const result = markdown('> Quote text', { ctx: ctx('pipe') });
        expect(result).toContain('> Quote text');
      });

      it('renders multi-line blockquote', () => {
        const result = markdown('> Line 1\n> Line 2', { ctx: ctx('pipe') });
        expect(result).toContain('> Line 1');
        expect(result).toContain('> Line 2');
      });
    });
});
