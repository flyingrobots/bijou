import { describe, it, expect } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { gridLayout } from './grid.js';

describe('gridLayout', () => {
  it('solves fixed + fr tracks', () => {
    const rects = gridLayout({
      width: 40,
      height: 10,
      columns: [10, '1fr', '1fr'],
      rows: [2, '1fr'],
      areas: ['nav main main', 'nav body body'],
      gap: 1,
    });
    const nav = rects.get('nav');
    const main = rects.get('main');
    const body = rects.get('body');
    expect(nav?.width).toBe(10);
    expect(nav?.row).toBe(0);
    expect(nav?.col).toBe(0);
    expect(nav?.height).toBe(10);
    expect(main?.row).toBe(0);
    expect(main?.col).toBe(11);
    expect(main?.width).toBe(29);
    expect(main?.height).toBe(2);
    expect(body?.row).toBe(3);
    expect(body?.col).toBe(11);
    expect(body?.width).toBe(29);
    expect(body?.height).toBe(7);
    expect(must(nav).width + 1 + must(main).width).toBe(40);
    expect(must(main).height + 1 + must(body).height).toBe(10);
  });
  it('clamps fixed columns when they exceed available width', () => {
    const rects = gridLayout({
      width: 10,
      height: 2,
      columns: [8, 8],
      rows: [2],
      areas: ['a b'],
      gap: 1,
    });
    expect(rects.get('a')?.width).toBe(8);
    expect(rects.get('b')?.width).toBe(1);
    expect(rects.get('b')?.col).toBe(9);
  });
  it('clamps fixed rows when they exceed available height', () => {
    const rects = gridLayout({
      width: 6,
      height: 7,
      columns: [6],
      rows: [5, 5],
      areas: ['top', 'bottom'],
      gap: 1,
    });
    expect(rects.get('top')?.height).toBe(5);
    expect(rects.get('bottom')?.height).toBe(1);
    expect(rects.get('bottom')?.row).toBe(6);
  });
  it('throws when area rows mismatch tracks', () => {
    expect(() => gridLayout({
      width: 10,
      height: 10,
      columns: [5, 5],
      rows: [5, 5],
      areas: ['a b'],
    })).toThrow(/areas row count/);
  });
  it('throws on non-rectangular named area', () => {
    expect(() => gridLayout({
      width: 20,
      height: 10,
      columns: ['1fr', '1fr', '1fr'],
      rows: ['1fr', '1fr'],
      areas: ['a a b', 'a b b'],
    })).toThrow(/contiguous rectangle/);
  });
  it('rejects fractional fr tracks', () => {
    expect(() => gridLayout({
      width: 20,
      height: 6,
      columns: ['1.5fr', '1fr'],
      rows: ['1fr'],
      areas: ['a b'],
    })).toThrow(/invalid fr track/);
  });
});
