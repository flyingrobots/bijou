import type { Surface, BijouContext, LayoutNode } from '@flyingrobots/bijou';
import { RENDER_STAGE_TIMINGS_KEY, RENDER_LAYOUT_ROOT_KEY } from './pipeline-keys.js';
export { RENDER_STAGE_TIMINGS_KEY, RENDER_LAYOUT_ROOT_KEY } from './pipeline-keys.js';

export interface RenderState {
  model: unknown;
  ctx: BijouContext;
  dt: number;
  readonly currentSurface: Surface;
  targetSurface: Surface;
  /** Pooled byte buffer owned by the runtime for direct UTF-8 emission. */
  outBuf?: Uint8Array;
  layoutMap: Map<string, unknown>;
  data: Record<string, unknown>;
}

export type RenderMiddleware = (state: RenderState, next: () => void) => void | Promise<void>;

export type RenderStage = 'Layout' | 'Paint' | 'PostProcess' | 'Diff' | 'Output';

/** Per-stage timing sample captured during a single pipeline execution. */
export interface RenderStageTiming {
  /** Stage that completed. */
  readonly stage: RenderStage;
  /** Wall-clock duration for this stage in milliseconds. */
  readonly durationMs: number;
}

/** Observer notified whenever a render stage completes. */
export type RenderStageCompleteHandler = (
  stage: RenderStage,
  durationMs: number,
  state: RenderState,
) => void;

/** Disposable observer registration handle. */
export interface RenderStageObserver {
  dispose(): void;
}

export function getRenderLayoutRoot(state: Pick<RenderState, 'data'>): LayoutNode | undefined {
  const root = state.data[RENDER_LAYOUT_ROOT_KEY];
  return isLayoutNode(root) ? root : undefined;
}

export function getRenderStageTimings(state: Pick<RenderState, 'data'>): readonly RenderStageTiming[] {
  const timings = state.data[RENDER_STAGE_TIMINGS_KEY];
  return Array.isArray(timings) ? timings as readonly RenderStageTiming[] : [];
}

export interface RenderPipeline {
  /** Register middleware for a specific stage. */
  use(stage: RenderStage, middleware: RenderMiddleware): void;
  /** Observe per-stage completion timings for each pipeline execution. */
  onStageComplete(handler: RenderStageCompleteHandler): RenderStageObserver;
  /** Execute the entire pipeline for a given state. */
  execute(state: RenderState): void;
}

/** Options for creating a programmable render pipeline. */
export interface CreatePipelineOptions {
  /** Timing source override for deterministic tests. */
  now?: () => number;
  /** Diagnostic hook invoked when stage plan cache rebuilds. */
  onPlanRebuild?: () => void;
}

function isLayoutNode(value: unknown): value is LayoutNode {
  return typeof value === 'object' && value !== null && 'rect' in value && 'children' in value;
}

export { createPipeline } from './pipeline-execution.js';
