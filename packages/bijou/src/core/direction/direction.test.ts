import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { mockIO } from '../../adapters/test/io.js';
import { mockRuntime } from '../../adapters/test/runtime.js';
import { plainStyle } from '../../adapters/test/style.js';
import { createBijou } from '../../factory.js';
import {
  directionalSide,
  mirrorsLayout,
  orderForDirection,
  resolveDirection,
} from './direction.js';

describe('resolveDirection', () => {
  it('defaults to ltr when neither option nor context declares a direction', () => {
    expect(resolveDirection()).toBe('ltr');
    expect(resolveDirection({ ctx: createTestContext() })).toBe('ltr');
  });

  it('reads the context direction when no option is given', () => {
    const ctx = createTestContext({ direction: 'rtl' });
    expect(ctx.direction).toBe('rtl');
    expect(resolveDirection({ ctx })).toBe('rtl');
  });

  it('lets an explicit option override the context', () => {
    const ctx = createTestContext({ direction: 'rtl' });
    expect(resolveDirection({ ctx, direction: 'ltr' })).toBe('ltr');
    expect(resolveDirection({ direction: 'rtl', ctx: createTestContext() })).toBe('rtl');
  });
});

describe('createBijou direction', () => {
  it('carries an explicit direction and leaves it absent by default', () => {
    const ports = { runtime: mockRuntime(), io: mockIO(), style: plainStyle() };
    expect(resolveDirection({ ctx: createBijou({ ...ports, direction: 'rtl' }) })).toBe('rtl');
    expect(createBijou(ports).direction).toBeUndefined();
  });
});

describe('mirrorsLayout', () => {
  it('mirrors only rtl layout in interactive and static modes', () => {
    expect(mirrorsLayout({ ctx: createTestContext({ direction: 'rtl' }) })).toBe(true);
    expect(mirrorsLayout({ ctx: createTestContext({ direction: 'rtl', mode: 'static' }) })).toBe(true);
    expect(mirrorsLayout({ ctx: createTestContext({ direction: 'ltr' }) })).toBe(false);
  });

  it('keeps pipe and accessible output in logical order', () => {
    expect(mirrorsLayout({ ctx: createTestContext({ direction: 'rtl', mode: 'pipe' }) })).toBe(false);
    expect(mirrorsLayout({ ctx: createTestContext({ direction: 'rtl', mode: 'accessible' }) })).toBe(false);
  });
});

describe('directionalSide', () => {
  it('maps logical start and end to physical sides', () => {
    expect(directionalSide('start', 'ltr')).toBe('left');
    expect(directionalSide('end', 'ltr')).toBe('right');
    expect(directionalSide('start', 'rtl')).toBe('right');
    expect(directionalSide('end', 'rtl')).toBe('left');
  });
});

describe('orderForDirection', () => {
  it('returns visual order without mutating the logical sequence', () => {
    const items = ['Home', 'Docs', 'API'] as const;
    expect(orderForDirection(items, 'ltr')).toEqual(['Home', 'Docs', 'API']);
    expect(orderForDirection(items, 'rtl')).toEqual(['API', 'Docs', 'Home']);
    expect(items).toEqual(['Home', 'Docs', 'API']);
  });
});
