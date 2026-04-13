import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  BijouContext as CoreBijouContext,
  Cell as CoreCell,
  Surface as CoreSurface,
} from '@flyingrobots/bijou';
import {
  canvas,
  projectFrameControls,
  type BijouContext,
  type Cell,
  type ShaderFn,
  type Surface,
} from './index.js';

describe('package root export ergonomics', () => {
  it('supports single-import canvas authoring from bijou-tui', () => {
    const shader: ShaderFn = () => ({ char: 'X' });
    const surface: Surface = canvas(1, 1, shader);

    expect(surface.get(0, 0).char).toBe('X');
    expectTypeOf<BijouContext>().toEqualTypeOf<CoreBijouContext>();
    expectTypeOf<Cell>().toEqualTypeOf<CoreCell>();
    expectTypeOf<Surface>().toEqualTypeOf<CoreSurface>();
  });

  it('re-exports framed shell control projection helpers from the package root', () => {
    expect(typeof projectFrameControls).toBe('function');
  });
});
