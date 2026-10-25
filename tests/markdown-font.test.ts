import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { markdown, stripAnsi } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { FontRasterizer } from '../examples/markdown-font/font-rasterizer.js';
import { parseGoogleCatalog, googleFontUrl } from '../examples/markdown-font/google-fonts.js';
import { chooseGoogleFont } from '../examples/markdown-font/load-font.js';
import { parseOptions } from '../examples/markdown-font/options.js';
import { renderMarkdownFont } from '../examples/markdown-font/render.js';

const font = new FontRasterizer(readFileSync(new URL('../assets/fonts/space-grotesk/SpaceGrotesk.ttf', import.meta.url)), 'Space Grotesk');
const options = { width: 80, raster: true, fontForText: (text: string) => font.forText(text) };

describe('Markdown font demo', () => {
  it('renders actual Google Fonts glyphs while preserving body blocks and code headings', () => {
    const ctx = createTestContext();
    const output = stripAnsi(renderMarkdownFont('# Bijou\n\nHello **reader**.\n\n## Details\n\n- One\n\n```md\n# Literal\n```', ctx, options));
    expect(output).toMatch(/[\u2801-\u28ff]/u);
    expect(output).not.toContain('Bijou');
    expect(output).toContain('Hello reader.');
    expect(output).toContain('Details');
    expect(output).toContain('One');
    expect(output).toContain('# Literal');
  });

  it.each(['pipe', 'accessible'] as const)('preserves normal Markdown output in %s mode', (mode) => {
    const ctx = createTestContext({ mode });
    const source = '# Title\n\nParagraph.\n\n- One\n- Two';
    expect(renderMarkdownFont(source, ctx, { ...options, raster: false })).toBe(markdown(source, { ctx, width: 80 }));
  });

  it('keeps narrow, unsupported, and oversized headings readable', () => {
    const ctx = createTestContext();
    expect(renderMarkdownFont('# Hello', ctx, { ...options, width: 10 })).toContain('Hello');
    expect(renderMarkdownFont('# Hello 😀', ctx, options)).toContain('Hello 😀');
    expect(renderMarkdownFont('# ' + 'A'.repeat(257), ctx, options)).toContain('A'.repeat(257));
  });

  it('wraps long headings without exceeding the requested width', () => {
    const output = renderMarkdownFont('# A long title with many words and Supercalifragilisticexpialidocious', createTestContext(), { ...options, width: 30 });
    const lines = stripAnsi(output).split('\n');
    expect(lines.length).toBeGreaterThan(6);
    expect(lines.every((line) => Array.from(line).length <= 30)).toBe(true);
    expect(output).toMatch(/[\u2801-\u28ff]/u);
  });

  it('normalizes CRLF and strips H1 inline formatting before rendering', () => {
    const ctx = createTestContext();
    expect(renderMarkdownFont('\uFEFF# **Bijou** ###\r\n\r\nBody', ctx, options))
      .toBe(renderMarkdownFont('# Bijou\n\nBody', ctx, options));
  });

  it('rejects invalid widths and accepts an empty document', () => {
    expect(() => renderMarkdownFont('# Title', createTestContext(), { ...options, width: 0 })).toThrow('width');
    expect(renderMarkdownFont('', createTestContext(), options)).toBe('');
  });

  it('validates font options and keeps local and Google choices exclusive', () => {
    expect(parseOptions(['doc.md', '--font', 'my.ttf']).fontPath).toBe('my.ttf');
    expect(parseOptions(['doc.md', '--google-font', 'Lora']).googleFamily).toBe('Lora');
    expect(parseOptions(['doc.md', '--offline']).offline).toBe(true);
    expect(() => parseOptions(['doc.md', '--font'])).toThrow('Usage');
    expect(() => parseOptions(['doc.md', '--font', 'x.ttf', '--google-font', 'Lora'])).toThrow('Choose one');
    expect(() => parseOptions(['doc.md', '--width=NaN'])).toThrow('Width');
  });

  it('validates and deduplicates downloaded catalog entries', () => {
    expect(parseGoogleCatalog({ familyMetadataList: [{ family: 'Lora' }, { family: 'Arial' }, { family: 'Lora' }] })).toEqual(['Arial', 'Lora']);
    expect(() => parseGoogleCatalog({ familyMetadataList: [{ family: '\u001b[31m' }] })).toThrow('family');
    expect(() => parseGoogleCatalog({ familyMetadataList: [] })).toThrow('empty');
    expect(() => parseGoogleCatalog(null)).toThrow('catalog');
  });

  it('selects a searched family through Bijou’s filter form', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['Lora'] } });
    expect(await chooseGoogleFont(ctx, ['Lora', 'Roboto'])).toBe('Lora');
    const defaultCtx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
    expect(await chooseGoogleFont(defaultCtx, ['Lora'])).toBe('Space Grotesk');
  });

  it('accepts one Google TrueType URL and rejects foreign or split font sources', () => {
    const css = "src: url(https://fonts.gstatic.com/font.ttf) format('truetype')";
    expect(googleFontUrl(css).hostname).toBe('fonts.gstatic.com');
    expect(() => googleFontUrl(css.replace('fonts.gstatic.com', 'example.com'))).toThrow('Unexpected');
    expect(() => googleFontUrl(css + css.replace('font.ttf', 'other.ttf'))).toThrow('one TrueType');
  });
});
