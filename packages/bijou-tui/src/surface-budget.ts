import { type Cell, type Surface } from '@flyingrobots/bijou';
import type { RenderStage } from './pipeline/pipeline.js';
import type { EvaluateSurfaceBudgetOptions, SurfaceBudgetMetric, SurfaceBudgetWarning } from './surface-budget-types.js';

export type {
  EvaluateSurfaceBudgetOptions,
  SurfaceBudgetMetric,
  SurfaceBudgetThresholds,
  SurfaceBudgetWarning,
} from './surface-budget-types.js';

const DEFAULT_SURFACE_BUDGET_LABEL = 'surface';
const MILLISECOND_UNIT = 'ms';
const HUNDREDTHS = 100;
const OPAQUE_OPACITY = 1;

export function evaluateSurfaceBudget(
  options: EvaluateSurfaceBudgetOptions,
): readonly SurfaceBudgetWarning[] {
  const { surface, thresholds, timings = [], label = DEFAULT_SURFACE_BUDGET_LABEL } = options;
  const warnings: SurfaceBudgetWarning[] = [];

  pushBudgetWarning(warnings, label, 'surface-width', surface.width, thresholds.maxWidth);
  pushBudgetWarning(warnings, label, 'surface-height', surface.height, thresholds.maxHeight);
  pushBudgetWarning(
    warnings,
    label,
    'surface-area',
    surface.width * surface.height,
    thresholds.maxArea,
  );

  if (thresholds.maxStyledCells !== undefined) {
    pushBudgetWarning(
      warnings,
      label,
      'styled-cells',
      countStyledCells(surface),
      thresholds.maxStyledCells,
    );
  }

  pushBudgetWarning(
    warnings,
    label,
    'frame-duration',
    timings.reduce((total, timing) => total + timing.durationMs, 0),
    thresholds.maxFrameDurationMs,
    MILLISECOND_UNIT,
  );

  if (thresholds.maxStageDurationMs !== undefined) {
    for (const timing of timings) {
      pushBudgetWarning(
        warnings,
        label,
        'stage-duration',
        timing.durationMs,
        thresholds.maxStageDurationMs[timing.stage],
        MILLISECOND_UNIT,
        timing.stage,
      );
    }
  }

  return warnings;
}

function pushBudgetWarning(
  warnings: SurfaceBudgetWarning[],
  label: string,
  metric: SurfaceBudgetMetric,
  actual: number,
  limit: number | undefined,
  unit = '',
  stage?: RenderStage,
): void {
  if (limit === undefined || !Number.isFinite(limit) || actual <= limit) {
    return;
  }

  warnings.push({
    label,
    metric,
    actual,
    limit,
    stage,
    message: surfaceBudgetMessage(label, metric, actual, limit, unit, stage),
  });
}

function surfaceBudgetMessage(
  label: string,
  metric: SurfaceBudgetMetric,
  actual: number,
  limit: number,
  unit: string,
  stage?: RenderStage,
): string {
  const metricLabel = stage === undefined ? metric : `${metric} ${stage}`;
  return `${label} ${metricLabel} ${formatBudgetNumber(actual)}${unit} > ${formatBudgetNumber(limit)}${unit}`;
}

function formatBudgetNumber(value: number): string {
  return String(Math.round(value * HUNDREDTHS) / HUNDREDTHS);
}

function countStyledCells(surface: Surface): number {
  let count = 0;

  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      if (isStyledCell(surface.get(x, y))) {
        count++;
      }
    }
  }

  return count;
}

function isStyledCell(cell: Cell): boolean {
  return cell.fg !== undefined
    || cell.bg !== undefined
    || cell.fgRGB !== undefined
    || cell.bgRGB !== undefined
    || (cell.modifiers?.length ?? 0) > 0
    || (cell.opacity !== undefined && cell.opacity < OPAQUE_OPACITY);
}
