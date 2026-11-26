import type { EndpointReceipt } from '@flyingrobots/geordi-bijou-gpu';
import type { BijouCanvasBackend, BijouCanvasFallbackReason } from '@flyingrobots/bijou-web';
import { HOST_LABELS, type ShowcaseHost } from './handoff.js';

/** Everything the HUD reports. The browser suite reads the same object. */
export interface HudState {
  readonly app: string | null;
  /** The mounted app's title, and whether it has a scene projection the DOM host can mount. */
  readonly appTitle: string | null;
  readonly sceneApp: boolean;
  /** Where the app is presented: cells on a canvas, or native elements. */
  readonly host: ShowcaseHost | null;
  /** The live model's own string, number and boolean fields, as `name value` pairs. */
  readonly model: string;
  readonly backend: BijouCanvasBackend | null;
  readonly fallbackReasons: readonly BijouCanvasFallbackReason[];
  readonly grid: { readonly cols: number; readonly rows: number } | null;
  readonly cellPx: { readonly width: number; readonly height: number };
  readonly dpr: number;
  readonly frameMs: number | null;
  readonly presents: number;
  readonly evidenceLevel: string | null;
  readonly adapter: string | null;
  readonly atlasGeneration: number | null;
  readonly shaderSha256: string | null;
  readonly frameRgbaSha256: string | null;
  readonly contextLost: boolean;
  /** A typed refusal or fault, as `CODE: detail`, or null while healthy. */
  readonly problem: string | null;
  readonly canvases: number;
}

/** Copy the parts of a receipt the HUD shows. */
export function receiptFields(receipt: EndpointReceipt | null): Pick<HudState, 'evidenceLevel' | 'adapter' | 'atlasGeneration' | 'shaderSha256' | 'frameRgbaSha256'> {
  return {
    evidenceLevel: receipt?.evidenceLevel ?? null,
    adapter: receipt === null ? null : `${receipt.adapter.name} (${receipt.adapter.driver})`,
    atlasGeneration: receipt?.atlasGeneration ?? null,
    shaderSha256: receipt?.shaderSha256 ?? null,
    frameRgbaSha256: receipt?.frameRgbaSha256 ?? null,
  };
}

/** Why the mounted app offers no DOM host, or null when it does. */
export function hostNote(state: Pick<HudState, 'appTitle' | 'sceneApp'>): string | null {
  return state.sceneApp || state.appTitle === null ? null : `${state.appTitle} has no scene projection, so it runs on the canvas only.`;
}

/** The model's scalar fields, short enough for one HUD row. */
export function modelText(model: unknown): string {
  if (typeof model !== 'object' || model === null) return 'none';
  const fields = Object.entries(model).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value));
  const text = fields.map(([name, value]) => `${name} ${JSON.stringify(value)}`).join(' ');
  if (text === '') return 'no scalar fields';
  return text.length > 96 ? `${text.slice(0, 95)}…` : text;
}

function hostText(state: HudState): string {
  if (state.host === null) return 'none';
  const label = HOST_LABELS[state.host];
  return state.host === 'canvas' && !state.sceneApp && state.appTitle !== null ? `${label} (no DOM: ${state.appTitle} has no scene projection)` : label;
}

const BACKEND_NAMES: Record<BijouCanvasBackend, string> = { webgpu: 'WebGPU', webgl2: 'WebGL2', canvas2d: 'Canvas 2D' };
const short = (digest: string | null): string => (digest === null ? 'none' : `${digest.slice(0, 12)}…`);

/** The rows of the HUD, each a label and the text the page shows for it. */
export function hudRows(state: HudState): readonly (readonly [string, string, string])[] {
  const reasons = state.fallbackReasons.map((reason) => `${BACKEND_NAMES[reason.backend]}: ${reason.code} (${reason.reason})`);
  return [
    ['app', 'App', state.app ?? 'none'],
    ['host', 'Host', hostText(state)],
    ['model', 'Model', state.model],
    ['backend', 'Backend', state.backend === null ? 'none' : BACKEND_NAMES[state.backend]],
    ['fallback', 'Fallback reasons', reasons.length === 0 ? 'none' : reasons.join('; ')],
    ['grid', 'Grid', state.grid === null ? 'none' : `${String(state.grid.cols)} × ${String(state.grid.rows)}`],
    ['cell', 'Cell', `${String(state.cellPx.width)} × ${String(state.cellPx.height)} px`],
    ['dpr', 'Device pixel ratio', String(state.dpr)],
    ['frame', 'Frame time', state.frameMs === null ? 'none' : `${state.frameMs.toFixed(2)} ms (${String(state.presents)} frames)`],
    ['evidence', 'Evidence', state.evidenceLevel ?? 'none'],
    ['adapter', 'Adapter', state.adapter ?? 'none'],
    ['atlas', 'Atlas generation', state.atlasGeneration === null ? 'none' : String(state.atlasGeneration)],
    ['shader', 'Shader', short(state.shaderSha256)],
    ['frame-sha', 'Frame', short(state.frameRgbaSha256)],
    ['context', 'WebGL2 context', state.contextLost ? 'lost' : 'live'],
    ['problem', 'Refusal or fault', state.problem ?? 'none'],
  ];
}
