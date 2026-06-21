import { describe, expect, it } from 'vitest';
import { type Surface } from '@flyingrobots/bijou';
import { proseSurface } from './surface-layout.js';

function plainSurface(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

describe('proseSurface', () => {
  it('wraps prose at word boundaries before converting it to a surface', () => {
    const result = proseSurface(
      "This is going to be too short. You'll see in a moment that it splits all weird.",
      { width: 48 },
    );

    expect(result.width).toBe(48);
    expect(plainSurface(result)).toContain(
      "This is going to be too short. You'll see in a",
    );
    expect(plainSurface(result)).toContain('moment that it splits all weird.');
    expect(plainSurface(result)).not.toContain('mo\nment');
  });

  it('keeps unbroken tokens within the requested width', () => {
    const result = proseSurface('supercalifragilistic', { width: 5 });

    expect(result.width).toBe(5);
    expect(plainSurface(result)).toBe('super\ncalif\nragil\nistic');
  });

  it('falls back to a finite width before wrapping prose', () => {
    for (const width of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = proseSurface('abc', { width });

      expect(result.width).toBe(1);
      expect(plainSurface(result)).toBe('a\nb\nc');
    }
  });
});
