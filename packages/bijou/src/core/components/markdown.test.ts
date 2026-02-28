import { describe, it, expect } from 'vitest';
import { markdown } from './markdown.js';
import { createTestContext } from '../../adapters/test/index.js';

function ctx(mode: 'interactive' | 'pipe' | 'accessible' = 'interactive', width = 80) {
  return createTestContext({ mode, runtime: { columns: width } });
}

describe('markdown()', () => {
  describe('headings', () => {
    it('renders h1 in interactive mode', () => {
      const result = markdown('# Hello World', { ctx: ctx() });
      expect(result).toContain('Hello World');
    });

    it('renders h2 in interactive mode', () => {
      const result = markdown('## Section', { ctx: ctx() });
      expect(result).toContain('Section');
    });

    it('renders heading in pipe mode with # prefix', () => {
      const result = markdown('# Title', { ctx: ctx('pipe') });
      expect(result).toContain('# Title');
    });

    it('renders heading in accessible mode with label', () => {
      const result = markdown('# Title', { ctx: ctx('accessible') });
      expect(result).toContain('Heading level 1: Title');
    });

    it('renders h3 in accessible mode', () => {
      const result = markdown('### Sub-section', { ctx: ctx('accessible') });
      expect(result).toContain('Heading level 3: Sub-section');
    });
  });

  describe('bold and italic', () => {
    it('renders bold text', () => {
      const result = markdown('This is **bold** text.', { ctx: ctx() });
      expect(result).toContain('bold');
    });

    it('renders italic text', () => {
      const result = markdown('This is *italic* text.', { ctx: ctx() });
      expect(result).toContain('italic');
    });

    it('strips bold markers in pipe mode', () => {
      const result = markdown('**bold** text', { ctx: ctx('pipe') });
      expect(result).toBe('bold text');
      expect(result).not.toContain('**');
    });

    it('strips italic markers in pipe mode', () => {
      const result = markdown('*italic* text', { ctx: ctx('pipe') });
      expect(result).toBe('italic text');
    });
  });

  describe('code spans', () => {
    it('renders inline code', () => {
      const result = markdown('Use `npm install` to install.', { ctx: ctx() });
      expect(result).toContain('npm install');
    });

    it('strips backticks in pipe mode', () => {
      const result = markdown('Run `cmd`', { ctx: ctx('pipe') });
      expect(result).toBe('Run cmd');
    });
  });

  describe('bullet lists', () => {
    it('renders bullet list with unicode bullets', () => {
      const result = markdown('- Item 1\n- Item 2\n- Item 3', { ctx: ctx() });
      expect(result).toContain('\u2022 Item 1');
      expect(result).toContain('\u2022 Item 2');
      expect(result).toContain('\u2022 Item 3');
    });

    it('renders bullet list in pipe mode with dashes', () => {
      const result = markdown('- First\n- Second', { ctx: ctx('pipe') });
      expect(result).toContain('- First');
      expect(result).toContain('- Second');
    });

    it('renders asterisk bullets same as dashes', () => {
      const result = markdown('* Alpha\n* Beta', { ctx: ctx() });
      expect(result).toContain('\u2022 Alpha');
      expect(result).toContain('\u2022 Beta');
    });
  });

  describe('numbered lists', () => {
    it('renders numbered list', () => {
      const result = markdown('1. First\n2. Second\n3. Third', { ctx: ctx() });
      expect(result).toContain('1. First');
      expect(result).toContain('2. Second');
      expect(result).toContain('3. Third');
    });

    it('renders in pipe mode', () => {
      const result = markdown('1. A\n2. B', { ctx: ctx('pipe') });
      expect(result).toContain('1. A');
      expect(result).toContain('2. B');
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
      // Should contain separator content (uses unicode box-drawing)
      expect(result.length).toBeGreaterThan(0);
    });

    it('renders hr with asterisks', () => {
      const result = markdown('***', { ctx: ctx() });
      expect(result.length).toBeGreaterThan(0);
    });

    it('renders hr in pipe mode', () => {
      const result = markdown('---', { ctx: ctx('pipe') });
      expect(result).toContain('---');
    });
  });

  describe('links', () => {
    it('renders link in interactive mode as hyperlink', () => {
      const result = markdown('[Click](https://example.com)', { ctx: ctx() });
      expect(result).toContain('Click');
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

    it('handles nested inline formatting', () => {
      const result = markdown('This has **bold and `code`** inside.', { ctx: ctx('pipe') });
      expect(result).toContain('bold and code');
    });
  });
});
