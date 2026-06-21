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
});
