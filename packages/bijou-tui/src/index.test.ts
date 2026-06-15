import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  BijouContext as CoreBijouContext,
  Cell as CoreCell,
  Surface as CoreSurface,
} from '@flyingrobots/bijou';
import {
  canvas,
  fitCellGlyph,
  PAGE_MSG_TOKEN,
  projectFrameControls,
  raytraceLookAtRay,
  wrapCmdForPage,
  wrapPageMsg,
  emitMsgForPage,
  isPageScopedMsg,
  type BijouContext,
  type Cell,
  type FramedAppMsg,
  type MouseScriptStepOptions,
  type RaytraceRay,
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

  it('re-exports page-scoped frame message helpers from the package root', async () => {
    const wrapped = wrapPageMsg('home', { type: 'local' });
    expect(wrapped[PAGE_MSG_TOKEN]).toBe(true);
    expect(isPageScopedMsg(wrapped)).toBe(true);
    expectTypeOf(wrapped).toMatchTypeOf<FramedAppMsg<{ type: string }>>();

    const emitted = await emitMsgForPage('home', { type: 'from-command' })(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 0,
    });
    expect(isPageScopedMsg(emitted)).toBe(true);

    const cmd = wrapCmdForPage('home', async () => ({ type: 'wrapped' as const }));
    const result = await cmd(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 0,
    });
    expect(isPageScopedMsg(result)).toBe(true);
  });

  it('re-exports mouse driver helper types from the package root', () => {
    const options: MouseScriptStepOptions = { delay: 1, shift: true };
    expect(options.delay).toBe(1);
  });

  it('re-exports raytrace shader helpers from the package root', () => {
    const ray: RaytraceRay = raytraceLookAtRay({
      origin: [0, 0, 1],
      target: [0, 0, 0],
      screen: [0, 0],
    });

    expect(ray.direction).toEqual([0, 0, -1]);
  });

  it('re-exports cell glyph fitting helpers from the package root', () => {
    expect(fitCellGlyph([1, 1, 1, 1, 1, 1, 1, 1])).toBe('█');
  });
});
