import { describe, expect, it } from 'vitest';
import { stringToSurface, type Surface } from '@flyingrobots/bijou';
import { hstackSurface } from './surface-layout.js';

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

describe('hstackSurface', () => {
  it('stacks surfaces horizontally with a gap', () => {
    const result = hstackSurface(
      1,
      stringToSurface('a\nb', 1, 2),
      stringToSurface('cd', 2, 1),
    );

    expect(result.width).toBe(4);
    expect(result.height).toBe(2);
    expect(plainSurface(result)).toBe('a cd\nb   ');
  });

  it('bridges string blocks without forcing callers through stringToSurface first', () => {
    const result = hstackSurface(
      1,
      'a\nb',
      stringToSurface('cd', 2, 1),
    );

    expect(result.width).toBe(4);
    expect(result.height).toBe(2);
    expect(plainSurface(result)).toBe('a cd\nb   ');
  });
});
