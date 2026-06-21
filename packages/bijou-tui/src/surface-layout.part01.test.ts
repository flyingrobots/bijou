import { describe, expect, it } from 'vitest';
import { type Surface } from '@flyingrobots/bijou';
import { contentSurface } from './surface-layout.js';

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

describe('contentSurface', () => {
  it('measures ANSI-colored multiline text before bridging into a surface', () => {
    const result = contentSurface('\x1b[31mAB\x1b[0m\nZ');

    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(plainSurface(result)).toBe('AB\nZ ');
  });
});
