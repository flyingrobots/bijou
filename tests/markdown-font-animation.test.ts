import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createDocumentAnimation } from '../examples/markdown-font/animate-document.js';
import { themeColor } from '../examples/markdown-font/theme-color.js';
import { parseOptions } from '../examples/markdown-font/options.js';
import { isSurfaceView } from '../packages/bijou-tui/src/view-output.js';

const ctx = createTestContext({ runtime: { columns: 40, rows: 8 } });
const key = (value: string) => ({ type: 'key' as const, key: value, ctrl: false, shift: false, alt: false });

describe('Markdown theme animation', () => {
  it('follows the active theme gradient and returns to its starting color', () => {
    expect(themeColor(ctx, 0)).not.toBe(themeColor(ctx, 50));
    expect(themeColor(ctx, 0)).toBe(themeColor(ctx, 200));
    expect(themeColor(ctx, 25)).toBe(themeColor(ctx, 175));
    const [red, green, blue] = ctx.gradient('brand')[0]?.color ?? [0, 0, 0];
    const expected = '#' + [red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('');
    expect(themeColor(ctx, 0)).toBe(expected);
  });

  it('changes only font colors while preserving glyphs and ordinary text', () => {
    const app = createDocumentAnimation(() => [
      { text: '\u001b[38;2;0;255;255m⣿⣿\u001b[0m', raster: true },
      { text: 'Body ⣿', raster: false },
    ], ctx, 40);
    const [model] = app.init();
    const before = app.view(model);
    const after = app.view({ ...model, step: 50 });
    if (!isSurfaceView(before) || !isSurfaceView(after)) throw new Error('Expected surface frames.');
    expect(before.get(0, 0).char).toBe(after.get(0, 0).char);
    expect(before.get(0, 0).fg).not.toBe(after.get(0, 0).fg);
    expect(before.get(0, 0).fgRGB).not.toEqual(after.get(0, 0).fgRGB);
    expect(before.get(0, 2)).toEqual(after.get(0, 2));
    expect(before.get(5, 2)).toEqual(after.get(5, 2));
  });

  it('pauses and resumes the color phase without creating an extra timer chain', () => {
    const app = createDocumentAnimation(() => [{ text: '⣿', raster: true }], ctx, 40);
    const [model, commands] = app.init();
    expect(commands).toHaveLength(1);
    const [paused, pauseCommands] = app.update(key('space'), model);
    expect(pauseCommands).toHaveLength(0);
    const [stillPaused, ticks] = app.update({ type: 'color-tick' }, paused);
    expect(stillPaused.step).toBe(0);
    expect(ticks).toHaveLength(1);
    const [resumed] = app.update(key('space'), stillPaused);
    const [advanced] = app.update({ type: 'color-tick' }, resumed);
    expect(advanced.step).toBe(1);
  });

  it('scrolls within the document and reflows when the terminal changes width', () => {
    const app = createDocumentAnimation((width) => [{ text: String(width) + '\nline'.repeat(30), raster: true }], ctx, 40);
    const [model] = app.init();
    const [end] = app.update(key('end'), model);
    expect(end.offset).toBe(24);
    const [home] = app.update(key('home'), end);
    expect(home.offset).toBe(0);
    const [resized] = app.update({ type: 'resize', columns: 25, rows: 10 }, end);
    expect(resized.lines[0]?.text).toBe('25');
    expect(resized.offset).toBe(22);
    const [, quit] = app.update(key('q'), resized);
    expect(quit).toHaveLength(1);
  });

  it('provides a static output option', () => {
    expect(parseOptions(['doc.md']).animate).toBe(true);
    expect(parseOptions(['doc.md', '--no-animation']).animate).toBe(false);
  });
});
