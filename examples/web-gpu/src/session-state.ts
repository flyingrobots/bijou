import type { EndpointReceipt } from '@flyingrobots/geordi-bijou-gpu';
import type { LiveMount } from './host-mounts.js';
import { modelText, receiptFields, type HudState } from './hud.js';
import type { ShowcasePresenters, TrackedPresenter } from './presenters.js';

/** What the session knows that the HUD state is read from. */
export interface SessionFacts {
  readonly container: HTMLElement;
  readonly presenters: ShowcasePresenters;
  readonly live: LiveMount | undefined;
  /** The cell size and ratio the canvas mount was made with. */
  readonly metrics: { readonly cellPx: { readonly width: number; readonly height: number }; readonly dpr: number };
  readonly problem: string | null;
  readonly app: string | null;
  readonly appTitle: string | null;
  readonly sceneApp: boolean;
  readonly contextLost: boolean;
}

/**
 * The tracked presenter's newest receipt. A WebGPU readback rejects when a
 * switch disposes the presenter during it: that presenter is gone, so it has
 * no receipt to show. A failure of the presenter still presenting is thrown.
 */
async function readReceipt(tracked: TrackedPresenter | undefined, presenters: ShowcasePresenters): Promise<EndpointReceipt | null> {
  if (tracked === undefined) return null;
  try {
    return await tracked.receipt();
  } catch (error: unknown) {
    if (presenters.presenterFor(tracked.canvas) !== tracked) return null;
    throw error;
  }
}

/** Everything the HUD reports, read from the live mount. The DOM host has no canvas, presenter or receipt. */
export async function readState(facts: SessionFacts): Promise<HudState> {
  const canvas = facts.live?.canvas;
  const tracked = facts.presenters.presenterFor(canvas?.canvas ?? null);
  const runtime = canvas?.ctx.runtime;
  const receipt = await readReceipt(tracked, facts.presenters);
  return {
    app: facts.app,
    appTitle: facts.appTitle,
    sceneApp: facts.sceneApp,
    host: facts.live?.host ?? null,
    model: modelText(facts.live?.model()),
    backend: canvas?.backend ?? null,
    fallbackReasons: canvas?.fallbackReasons ?? [],
    grid: runtime === undefined ? null : { cols: runtime.columns, rows: runtime.rows },
    cellPx: facts.metrics.cellPx,
    dpr: facts.metrics.dpr,
    frameMs: tracked?.lastPresentMs ?? null,
    presents: tracked?.presents ?? 0,
    ...receiptFields(receipt),
    contextLost: facts.contextLost,
    problem: facts.problem,
    canvases: facts.container.querySelectorAll('canvas').length,
  };
}
