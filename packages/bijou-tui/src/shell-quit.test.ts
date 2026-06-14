import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stripAnsi } from '@flyingrobots/bijou';
import { renderShellQuitOverlay } from './shell-quit.js';

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

describe('shell quit confirmation', () => {
  it('renders the quit controls once', () => {
    const overlay = renderShellQuitOverlay(80, 24);
    const text = stripAnsi(overlay.content);

    expect(text).toContain('Quit this app?');
    expect(occurrences(text, 'Y Quit')).toBe(1);
    expect(occurrences(text, 'N Stay')).toBe(1);
  });

  it('uses compact themed geometry for the confirmation modal', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const overlay = renderShellQuitOverlay(80, 24, undefined, ctx);

    expect(overlay.surface).toBeDefined();
    expect(overlay.surface!.width).toBeGreaterThanOrEqual(36);
    expect(overlay.surface!.width).toBeLessThanOrEqual(44);
    expect(overlay.surface!.height).toBeLessThanOrEqual(7);
    expect(overlay.surface!.get(2, 3).bg).toBe(ctx.surface('elevated').bg);
  });

  it('styles quit action keys so they are not muted into the body copy', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const overlay = renderShellQuitOverlay(80, 24, undefined, ctx);
    const surface = overlay.surface!;

    const actionCells: { char: string; modifiers?: readonly string[]; fg?: unknown; fgRGB?: unknown }[] = [];
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        const cell = surface.get(x, y);
        if (cell.char === 'Y' || cell.char === 'N') actionCells.push(cell);
      }
    }

    expect(actionCells).toHaveLength(2);
    for (const cell of actionCells) {
      expect(cell.modifiers).toContain('bold');
      expect(cell.fg ?? cell.fgRGB).toBeDefined();
    }
  });
});
