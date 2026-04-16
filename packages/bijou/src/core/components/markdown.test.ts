import { describe, it, expect } from 'vitest';
import { markdown } from './markdown.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth, stripAnsi } from '../text/grapheme.js';

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
    it('renders bold text differently from pipe mode', () => {
      const interactive = markdown('This is **bold** text.', { ctx: ctx() });
      const pipe = markdown('This is **bold** text.', { ctx: ctx('pipe') });
      expect(interactive).toContain('bold');
      // Interactive strips ** markers but applies styling; pipe strips ** without styling
      // Both contain 'bold' but interactive wraps it with styled() call
      expect(interactive).not.toContain('**');
      expect(pipe).not.toContain('**');
    });

    it('renders italic text differently from pipe mode', () => {
      const interactive = markdown('This is *italic* text.', { ctx: ctx() });
      const pipe = markdown('This is *italic* text.', { ctx: ctx('pipe') });
      expect(interactive).toContain('italic');
      // Both strip markers; pipe doesn't apply styled()
      expect(interactive).not.toContain('*italic*');
      expect(pipe).not.toContain('*italic*');
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
    it('renders inline code and strips backticks', () => {
      const result = markdown('Use `npm install` to install.', { ctx: ctx() });
      expect(result).toContain('npm install');
      expect(result).not.toContain('`');
    });

    it('strips backticks in pipe mode', () => {
      const result = markdown('Run `cmd`', { ctx: ctx('pipe') });
      expect(result).toBe('Run cmd');
    });

    it('treats asterisks as literal text inside code spans in pipe mode', () => {
      const result = markdown('Use `a*b*c` here', { ctx: ctx('pipe') });
      expect(result).toBe('Use a*b*c here');
    });

    it('preserves double asterisks inside code spans in pipe mode', () => {
      const result = markdown('Use `**bold**` here', { ctx: ctx('pipe') });
      expect(result).toBe('Use **bold** here');
    });

    it('preserves asterisks inside code spans in accessible mode', () => {
      const result = markdown('Use `a*b*c` here', { ctx: ctx('accessible') });
      expect(result).toBe('Use a*b*c here');
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
      expect(markdown(null as any, { ctx: ctx() })).toBe('');
      expect(markdown(undefined as any, { ctx: ctx() })).toBe('');
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
