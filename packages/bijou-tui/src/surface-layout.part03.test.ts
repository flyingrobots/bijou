import { describe, expect, it } from 'vitest';
import { stringToSurface, type Surface } from '@flyingrobots/bijou';
import { vstackSurface } from './surface-layout.js';

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

describe('vstackSurface', () => {
  it('stacks surfaces vertically and widens to the widest child', () => {
    const result = vstackSurface(
      stringToSurface('ab', 2, 1),
      stringToSurface('x', 1, 1),
    );

    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(plainSurface(result)).toBe('ab\nx ');
  });

  it('bridges string blocks at the composition edge', () => {
    const result = vstackSurface(
      'ab',
      stringToSurface('x', 1, 1),
    );

    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(plainSurface(result)).toBe('ab\nx ');
  });
});
