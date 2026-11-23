import type { EndpointReceipt } from '@flyingrobots/geordi-bijou-gpu';
import type { BijouCanvasBackend, BijouCanvasFallbackReason } from '@flyingrobots/bijou-web';

/** Everything the HUD reports. The browser suite reads the same object. */
export interface HudState {
  readonly app: string | null;
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

const BACKEND_NAMES: Record<BijouCanvasBackend, string> = { webgpu: 'WebGPU', webgl2: 'WebGL2', canvas2d: 'Canvas 2D' };
const short = (digest: string | null): string => (digest === null ? 'none' : `${digest.slice(0, 12)}…`);

/** The rows of the HUD, each a label and the text the page shows for it. */
export function hudRows(state: HudState): readonly (readonly [string, string, string])[] {
  const reasons = state.fallbackReasons.map((reason) => `${BACKEND_NAMES[reason.backend]}: ${reason.code} (${reason.reason})`);
  return [
    ['app', 'App', state.app ?? 'none'],
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

/** Write the HUD rows into `list`, one `<dt>`/`<dd>` pair each. */
export function renderHud(list: HTMLElement, state: HudState): void {
  const rows = hudRows(state);
  if (list.children.length !== rows.length * 2) {
    list.replaceChildren(...rows.flatMap(([key, label]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const value = document.createElement('dd');
      value.dataset['hud'] = key;
      return [term, value];
    }));
  }
  for (const [key, , text] of rows) {
    const value = list.querySelector<HTMLElement>(`[data-hud="${key}"]`);
    if (value !== null && value.textContent !== text) value.textContent = text;
  }
}
