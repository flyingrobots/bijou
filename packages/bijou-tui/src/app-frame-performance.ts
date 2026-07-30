import {
  perfOverlaySurface,
  type BijouContext,
} from '@flyingrobots/bijou';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { Overlay } from './overlay.js';
import type { RenderStageTiming } from './pipeline/pipeline.js';
import { frameMessage } from './app-frame-i18n.js';

export interface FrameTimingSnapshot {
  readonly frameTimeMs: number;
  readonly viewTimeMs: number;
  readonly diffTimeMs: number;
  readonly frameBudgetMs?: number;
  readonly frameOverBudget: boolean;
}

export interface FramePerfHudTelemetry {
  readonly columns: number;
  readonly rows: number;
  readonly frameTimeMs: number;
  readonly viewTimeMs: number;
  readonly diffTimeMs: number;
  readonly refreshRate?: number;
}

export interface FramePerfHudOverlayOptions {
  readonly i18n?: I18nRuntime;
  readonly ctx?: BijouContext;
}

const readStageDuration = (
  timings: readonly RenderStageTiming[],
  stage: RenderStageTiming['stage'],
): number =>
  timings.find((timing) => timing.stage === stage)?.durationMs ?? 0;

export function summarizeFrameTimings(
  timings: readonly RenderStageTiming[],
  frameBudgetMs: number | undefined,
): FrameTimingSnapshot {
  const frameTimeMs = timings.reduce(
    (total, timing) => total + timing.durationMs,
    0,
  );
  return {
    frameTimeMs,
    viewTimeMs: readStageDuration(timings, 'Layout'),
    diffTimeMs: readStageDuration(timings, 'Diff'),
    frameBudgetMs,
    frameOverBudget:
      frameBudgetMs != null && frameTimeMs > frameBudgetMs,
  };
}

export function renderFramePerfHudOverlay(
  telemetry: FramePerfHudTelemetry,
  options: FramePerfHudOverlayOptions = {},
): Overlay {
  const refreshRate =
    telemetry.refreshRate ?? options.ctx?.runtime.refreshRate ?? 60;
  const fps =
    telemetry.frameTimeMs > 0
      ? Math.min(refreshRate, 1000 / telemetry.frameTimeMs)
      : refreshRate;
  const width = Math.max(12, Math.min(40, telemetry.columns - 2));
  const surface = perfOverlaySurface(
    {
      fps,
      frameTimeMs: telemetry.frameTimeMs,
      width: telemetry.columns,
      height: telemetry.rows,
      extras: [
        { label: 'view', value: `${telemetry.viewTimeMs.toFixed(2)} ms` },
        { label: 'diff', value: `${telemetry.diffTimeMs.toFixed(2)} ms` },
      ],
    },
    {
      title: frameMessage(options.i18n, 'perfHud.title', 'Perf HUD'),
      width,
      showChart: false,
      borderToken: options.ctx?.border('primary'),
      bgToken: options.ctx?.surface('elevated'),
      ctx: options.ctx,
    },
  );
  return {
    content: '',
    surface,
    row: 1,
    col: Math.max(0, telemetry.columns - surface.width - 1),
  };
}
