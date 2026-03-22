import { describe, expect, it } from 'vitest';
import { createSurface, stringToSurface, type Surface } from '@flyingrobots/bijou';
import { hstackSurface, placeSurface, vstackSurface } from './surface-layout.js';

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
});

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
});

describe('placeSurface', () => {
  it('left/top aligns by default', () => {
    const result = placeSurface(stringToSurface('hi', 2, 1), { width: 4, height: 2 });
    expect(plainSurface(result)).toBe('hi  \n    ');
  });

  it('centers content horizontally and vertically', () => {
    const result = placeSurface(stringToSurface('hi', 2, 1), {
      width: 6,
      height: 3,
      hAlign: 'center',
      vAlign: 'middle',
    });
    expect(plainSurface(result)).toBe('      \n  hi  \n      ');
  });

  it('right/bottom aligns content', () => {
    const result = placeSurface(stringToSurface('ok', 2, 1), {
      width: 5,
      height: 3,
      hAlign: 'right',
      vAlign: 'bottom',
    });
    expect(plainSurface(result)).toBe('     \n     \n   ok');
  });

  it('clips content that exceeds width or height', () => {
    const result = placeSurface(stringToSurface('abc\ndef\nghi', 3, 3), {
      width: 2,
      height: 2,
    });
    expect(plainSurface(result)).toBe('ab\nde');
  });

  it('preserves styled cells when placing content', () => {
    const content = createSurface(2, 1);
    content.set(0, 0, { char: 'A', fg: '#ff0000', empty: false });
    content.set(1, 0, { char: 'B', bg: '#001122', empty: false });

    const result = placeSurface(content, { width: 4, height: 2, hAlign: 'center', vAlign: 'middle' });

    expect(result.get(1, 0).char).toBe('A');
    expect(result.get(1, 0).fg).toBe('#ff0000');
    expect(result.get(2, 0).char).toBe('B');
    expect(result.get(2, 0).bg).toBe('#001122');
  });

  it('returns an empty surface when width or height are zero', () => {
    const widthZero = placeSurface(stringToSurface('hi', 2, 1), { width: 0, height: 3 });
    const heightZero = placeSurface(stringToSurface('hi', 2, 1), { width: 3, height: 0 });

    expect(widthZero.width).toBe(0);
    expect(widthZero.height).toBe(0);
    expect(heightZero.width).toBe(0);
    expect(heightZero.height).toBe(0);
  });
});
