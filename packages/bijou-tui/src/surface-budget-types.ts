import type { Surface } from '@flyingrobots/bijou';
import type { RenderStage, RenderStageTiming } from './pipeline/pipeline.js';

export type SurfaceBudgetMetric =
  | 'surface-width'
  | 'surface-height'
  | 'surface-area'
  | 'styled-cells'
  | 'frame-duration'
  | 'stage-duration';

export interface SurfaceBudgetThresholds {
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly maxArea?: number;
  readonly maxStyledCells?: number;
  readonly maxFrameDurationMs?: number;
  readonly maxStageDurationMs?: Partial<Record<RenderStage, number>>;
}

export interface EvaluateSurfaceBudgetOptions {
  readonly surface: Surface;
  readonly thresholds: SurfaceBudgetThresholds;
  readonly timings?: readonly RenderStageTiming[];
  readonly label?: string;
}

export interface SurfaceBudgetWarning {
  readonly label: string;
  readonly metric: SurfaceBudgetMetric;
  readonly actual: number;
  readonly limit: number;
  readonly message: string;
  readonly stage?: RenderStage;
}
