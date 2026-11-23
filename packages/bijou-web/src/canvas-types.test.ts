import { describe, expect, it } from 'vitest';
import type {
  BijouCanvasContainer, BijouCanvasElement, BijouCanvasFrame, BijouCanvasPresenter, BijouCanvasTextarea,
} from './index.js';

/**
 * Compile-time checks: the real DOM types satisfy the structural interfaces,
 * so a page passes its own elements without a cast. The test project compiles
 * with the DOM library; the package itself never names a DOM type.
 */
type Assignable<From, To> = [From] extends [To] ? true : false;

const divIsContainer: Assignable<HTMLDivElement, BijouCanvasContainer> = true;
const canvasIsElement: Assignable<HTMLCanvasElement, BijouCanvasElement> = true;
const textareaIsTextarea: Assignable<HTMLTextAreaElement, BijouCanvasTextarea> = true;

/** Geordi's `GpuPackedSurface`, restated: a frame must be assignable to it. */
interface GeordiPackedSurfaceShape {
  readonly width: number;
  readonly height: number;
  readonly buffer: Uint8Array;
  readonly sideTable: readonly string[];
  readonly renderDirtyWords: Uint32Array;
}

/** The slice of Geordi's `GpuSurfacePresenter` the mount calls, restated. */
interface GeordiPresenterShape {
  present(current: GeordiPackedSurfaceShape, target: GeordiPackedSurfaceShape, ctx: { readonly forceFullRefresh?: boolean }): void;
  resize(size: { readonly cssWidth: number; readonly cssHeight: number; readonly dpr: number }): void;
  cellFromPoint(clientX: number, clientY: number): { readonly col: number; readonly row: number } | null;
  getLastReceipt(): unknown;
  dispose(): void;
}

const frameIsGeordiSurface: Assignable<BijouCanvasFrame, GeordiPackedSurfaceShape> = true;
const geordiIsPresenter: Assignable<GeordiPresenterShape, BijouCanvasPresenter> = true;

describe('mountBijouCanvas() structural types', () => {
  it('accepts the real DOM elements and a Geordi-shaped presenter without a cast', () => {
    expect([divIsContainer, canvasIsElement, textareaIsTextarea, frameIsGeordiSurface, geordiIsPresenter])
      .toEqual([true, true, true, true, true]);
  });
});
