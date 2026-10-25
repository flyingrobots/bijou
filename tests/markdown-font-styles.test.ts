import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { stripAnsi, markdown } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { FontRasterizer } from '../examples/markdown-font/font-rasterizer.js';
import { configureStyles } from '../examples/markdown-font/configure-styles.js';
import { loadStyles } from '../examples/markdown-font/load-styles.js';
import { MarkdownStyles, TEXT_ELEMENTS } from '../examples/markdown-font/markdown-styles.js';
import { parseOptions } from '../examples/markdown-font/options.js';
import { renderMarkdownFont } from '../examples/markdown-font/render.js';
import { TextStyle } from '../examples/markdown-font/text-style.js';

const font = new FontRasterizer(readFileSync(new URL('../assets/fonts/space-grotesk/SpaceGrotesk.ttf', import.meta.url)), 'Space Grotesk');
const ctx = createTestContext();
const base = { width: 80, raster: true, fontForText: (text: string) => font.forText(text) };

describe('Markdown typography settings', () => {
  it.each(TEXT_ELEMENTS)('changes the font and size of %s independently', (element) => {
    const options = parseOptions(['doc.md', `--${element}-font`, 'Lora', `--${element}-size`, '37']);
    expect(options.styles?.for(element).font).toBe('google:Lora');
    expect(options.styles?.for(element).size).toBe(37);
    for (const other of TEXT_ELEMENTS.filter((value) => value !== element)) {
      expect(options.styles?.for(other)).toEqual(new MarkdownStyles().for(other));
    }
  });

  it('accepts file paths, terminal text, and sizes that enable raster paragraphs', () => {
    const options = parseOptions(['doc.md', '--p-font', './Body.otf', '--h2-font', 'terminal', '--h3-size', '16']);
    expect(options.styles?.for('p').font).toBe('file:./Body.otf');
    expect(options.styles?.for('h2').font).toBe('terminal');
    expect(options.styles?.for('h3').font).toBe('default');
    expect(() => parseOptions(['doc.md', '--p-size', '0'])).toThrow('4 to 256');
    expect(() => parseOptions(['doc.md', '--h2-size', 'NaN'])).toThrow('4 to 256');
    expect(() => new TextStyle('google:', 24)).toThrow('prefix');
  });

  it('renders every supported element at the requested height', () => {
    for (const [index, element] of TEXT_ELEMENTS.entries()) {
      const size = 8 + index * 4;
      const styles = new MarkdownStyles().with(element, new TextStyle('default', size));
      const source = element === 'p' ? 'Bijou' : '#'.repeat(index + 1) + ' Bijou';
      const output = stripAnsi(renderMarkdownFont(source, ctx, { ...base, styles }));
      expect(output).toMatch(/[\u2801-\u28ff]/u);
      expect(output.split('\n')).toHaveLength(Math.ceil(size / 4));
    }
  });

  it('preserves unspecified blocks and rasterizes paragraphs beyond the old title limit', () => {
    const styles = new MarkdownStyles().with('p', new TextStyle('default', 12));
    const body = 'A readable paragraph. '.repeat(20);
    const output = renderMarkdownFont('## Native heading\n\n' + body, ctx, { ...base, styles });
    expect(output).toContain('Native heading');
    expect(output).not.toContain('readable paragraph');
    expect(output).toMatch(/[\u2801-\u28ff]/u);
    const accessible = createTestContext({ mode: 'accessible' });
    expect(renderMarkdownFont('# Title\n\nBody', accessible, { ...base, styles }))
      .toBe(markdown('# Title\n\nBody', { ctx: accessible, width: 80 }));
  });

  it('loads separate local fonts for different elements and shares repeated font choices', async () => {
    const choice = 'file:assets/fonts/jacquard12/Jacquard12-Regular.ttf';
    const styles = new MarkdownStyles().with('h2', new TextStyle(choice, 20)).with('p', new TextStyle(choice, 12));
    const fonts = await loadStyles({ path: 'doc.md', offline: true, raster: true }, styles, ctx);
    expect(fonts.size).toBe(2);
    expect(fonts.get('default')?.forText('Bijou')?.family).toBe('Space Grotesk');
    expect(fonts.get(choice)?.forText('Bijou')?.family).toContain('Jacquard12-Regular.ttf');
  });

  it('edits a size through the interactive configuration form and returns the chosen settings', async () => {
    const formCtx = createTestContext({ mode: 'pipe', io: { answers: ['1', '1', '40', '6'] } });
    const styles = await configureStyles(formCtx, new MarkdownStyles());
    expect(styles.for('h1').size).toBe(40);
    expect(styles.for('h2').font).toBe('terminal');
  });

  it('stops oversized raster output before generating an unbounded document', () => {
    const styles = new MarkdownStyles().with('p', new TextStyle('default', 256));
    expect(() => renderMarkdownFont('Word '.repeat(2000), ctx, { ...base, styles }))
      .toThrow('output budget');
  });
});
