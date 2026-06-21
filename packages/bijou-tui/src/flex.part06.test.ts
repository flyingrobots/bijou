import { describe, it, expect } from 'vitest';
import { createSurface, stringToSurface } from '@flyingrobots/bijou';
import { flexSurface } from './flex.js';

function surfaceLines(surface: { width: number; height: number; get(x: number, y: number): { char: string } }): string[] {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines;
}

describe('flexSurface', () => {
  it('keeps surface children on the structured path in row layouts', () => {
    const left = stringToSurface('L', 1, 1);
    const right = stringToSurface('R', 1, 1);
    const result = flexSurface(
      { direction: 'row', width: 5, height: 3, gap: 1 },
      { basis: 2, content: left, align: 'center' },
      { basis: 2, content: right, align: 'end' },
    );
    const lines = surfaceLines(result);
    expect(lines[1]?.[0]).toBe('L');
    expect(lines[2]?.[3]).toBe('R');
  });
  it('supports column layouts with horizontal alignment for surface children', () => {
    const child = createSurface(2, 1);
    child.set(0, 0, { char: 'O', empty: false });
    child.set(1, 0, { char: 'K', empty: false });
    const result = flexSurface(
      { direction: 'column', width: 6, height: 3 },
      { basis: 1, content: child, align: 'center' },
      { basis: 1, content: stringToSurface('x', 1, 1), align: 'end' },
    );
    const lines = surfaceLines(result);
    expect(lines[0]).toBe('  OK  ');
    expect(lines[1]).toBe('     x');
  });
});
