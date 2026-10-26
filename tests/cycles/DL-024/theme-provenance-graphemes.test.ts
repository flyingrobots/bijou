import { describe, expect, it } from 'vitest';
import { createSurface } from '../../../packages/bijou/src/ports/surface.js';
import type { TokenValue } from '../../../packages/bijou/src/core/theme/tokens.js';
import { writeText } from '../../../examples/docs/app-theme-lab-editor-draw.js';

const TOKEN: TokenValue = { hex: '#ff00ff', bg: '#111111', modifiers: ['bold'] };

describe('Theme Lab provenance grapheme placement', () => {
  it('reserves a continuation cell before following text', () => {
    const surface = createSurface(4, 1);
    writeText(surface, 0, 0, '界e\u0301X', TOKEN);
    expect(surface.get(0, 0).char).toBe('界');
    expect(surface.get(1, 0).char).toBe('');
    expect(surface.get(2, 0).char).toBe('e\u0301');
    expect(surface.get(3, 0).char).toBe('X');
  });

  it('keeps a combining sequence in one cell', () => {
    const surface = createSurface(2, 1);
    writeText(surface, 0, 0, 'e\u0301X', TOKEN);
    expect(surface.get(0, 0).char).toBe('e\u0301');
    expect(surface.get(1, 0).char).toBe('X');
  });

  it('does not paint a wide glyph into a one-column remainder', () => {
    const surface = createSurface(1, 1);
    writeText(surface, 0, 0, '界X', TOKEN);
    expect(surface.get(0, 0).char).toBe(' ');
  });

  it('preserves foreground, background and modifiers on continuation cells', () => {
    const surface = createSurface(3, 1);
    writeText(surface, 1, 0, '界', TOKEN);
    for (const x of [1, 2]) {
      const cell = surface.get(x, 0);
      expect(cell.fg).toBe(TOKEN.hex);
      expect(cell.bg).toBe(TOKEN.bg);
      expect(cell.modifiers).toEqual(['bold']);
    }
    expect(surface.get(2, 0).char).toBe('');
  });
});
