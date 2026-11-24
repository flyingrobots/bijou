import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { demos } from '../examples/fun/registry.js';
import { stampPanel } from '../examples/fun/panel.js';
import { cellsOf, feed, frameScript, funContext, mountEntry } from './helpers/fun-demos.js';

function rows(surface: { readonly width: number; readonly height: number }, text: string): string[] {
  return Array.from({ length: surface.height }, (_, y) => text.slice(y * surface.width, (y + 1) * surface.width));
}

/** The panel's top border and its separator row, cut out of the frame text. */
function panelRules(lines: readonly string[]): { readonly top: string; readonly rule: string } {
  const top = lines.map((line) => /┌─+┐/u.exec(line)?.[0]).find((found) => found !== undefined) ?? '';
  const rule = lines.map((line) => /│─+│/u.exec(line)?.[0]).find((found) => found !== undefined) ?? '';
  return { top, rule };
}

describe('the fun demos panel separator', () => {
  it('spans the panel inner width when stamped directly', () => {
    const ctx = funContext(40, 10);
    const surface = createSurface(40, 10);
    stampPanel(surface, ['first line', '─'.repeat(3), 'a much longer second line'], ctx, () => ({ x: 0, y: 0 }));
    const text = cellsOf(surface).map((cell) => cell.char).join('');
    const { top, rule } = panelRules(rows(surface, text));
    expect(top).not.toBe('');
    expect(rule.length).toBe(top.length);
  });

  for (const entry of demos.filter((candidate) => candidate.id !== 'metaballs' || true)) {
    it(`${entry.id} draws a separator as wide as its panel's inner width`, () => {
      const ctx = funContext(80, 24);
      const frame = feed(mountEntry(entry), frameScript(entry.id, 80, 24)).view(80, 24, ctx);
      const { top, rule } = panelRules(rows(frame, cellsOf(frame).map((cell) => cell.char).join('')));
      expect(top).not.toBe('');
      expect(rule.length).toBe(top.length);
    });
  }
});
