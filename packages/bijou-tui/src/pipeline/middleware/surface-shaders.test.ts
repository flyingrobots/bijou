import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { RenderMiddleware, RenderState } from '../pipeline.js';
import {
  flicker,
  noise,
  scanlines,
  surfaceShaderFilter,
  vignette,
} from './surface-shaders.js';

function renderState(targetSurface: RenderState['targetSurface']): RenderState {
  return {
    model: {},
    ctx: createTestContext(),
    dt: 0.016,
    currentSurface: createSurface(targetSurface.width, targetSurface.height),
    targetSurface,
    layoutMap: new Map(),
    data: {},
  };
}

function runMiddleware(middleware: RenderMiddleware, targetSurface: RenderState['targetSurface']): boolean {
  let called = false;
  const result = middleware(renderState(targetSurface), () => {
    called = true;
  });
  expect(result).toBeUndefined();
  return called;
}

describe('surfaceShaderFilter', () => {
  it('applies scanlines as a post-process brightness pass', () => {
    const middleware = surfaceShaderFilter(scanlines({ dimFactor: 0.5 }));
    const targetSurface = createSurface(1, 2);
    targetSurface.set(0, 0, { char: 'A', fg: '#808080', bg: '#404040', empty: false });
    targetSurface.set(0, 1, { char: 'B', fg: '#808080', bg: '#404040', empty: false });

    expect(runMiddleware(middleware, targetSurface)).toBe(true);
    expect(targetSurface.get(0, 0).fg).toBe('#808080');
    expect(targetSurface.get(0, 1).fg).toBe('#404040');
    expect(targetSurface.get(0, 1).bg).toBe('#202020');
  });

  it('changes frame-wide brightness across successive flicker frames', () => {
    const middleware = surfaceShaderFilter(flicker({ minFactor: 0.85, maxFactor: 1.0 }));
    const first = createSurface(1, 1);
    const second = createSurface(1, 1);
    first.set(0, 0, { char: 'A', fg: '#808080', empty: false });
    second.set(0, 0, { char: 'A', fg: '#808080', empty: false });

    runMiddleware(middleware, first);
    runMiddleware(middleware, second);

    expect(first.get(0, 0).fg).not.toBe(second.get(0, 0).fg);
  });

  it('adds deterministic per-cell noise without crashing the packed path', () => {
    const middleware = surfaceShaderFilter(noise({ intensity: 0.18 }));
    const targetSurface = createSurface(2, 1);
    targetSurface.set(0, 0, { char: 'A', fg: '#808080', empty: false });
    targetSurface.set(1, 0, { char: 'B', fg: '#808080', empty: false });

    runMiddleware(middleware, targetSurface);

    expect(targetSurface.get(0, 0).fg).not.toBe('#808080');
    expect(targetSurface.get(0, 0).fg).not.toBe(targetSurface.get(1, 0).fg);
  });

  it('darkens edges more than the center for vignette', () => {
    const middleware = surfaceShaderFilter(vignette({ edgeFactor: 0.5, exponent: 1 }));
    const targetSurface = createSurface(3, 3);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        targetSurface.set(x, y, { char: 'X', fg: '#808080', empty: false });
      }
    }

    runMiddleware(middleware, targetSurface);

    expect(targetSurface.get(1, 1).fg).toBe('#808080');
    expect(targetSurface.get(0, 0).fg).toBe('#404040');
    expect(targetSurface.get(0, 0).fg).not.toBe(targetSurface.get(1, 1).fg);
  });
});
