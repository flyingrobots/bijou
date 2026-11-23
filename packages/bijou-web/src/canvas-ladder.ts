import {
  BIJOU_CANVAS_LADDER,
  type BijouCanvasAbortToken, type BijouCanvasBackend, type BijouCanvasBackendChoice, type BijouCanvasContainer,
  type BijouCanvasElement, type BijouCanvasFallbackReason, type BijouCanvasPresenter, type BijouCanvasPresenters,
  type BijouCanvasResize,
} from './canvas-contract.js';
import { detachNode, styleNode } from './canvas-elements.js';
import { abortedError, BijouCanvasError, errorCode, errorReason } from './canvas-errors.js';

/** Everything one negotiation needs. */
export interface LadderRequest<C extends BijouCanvasElement> {
  readonly choice: BijouCanvasBackendChoice;
  readonly presenters: BijouCanvasPresenters<C>;
  readonly createCanvas: () => C;
  readonly container: BijouCanvasContainer;
  readonly size: () => BijouCanvasResize;
  readonly token: BijouCanvasAbortToken;
  readonly isUnavailable: (error: unknown) => boolean;
}

/** A presenter, sized and ready, on its own canvas in the container. */
export interface LadderResult<C extends BijouCanvasElement> {
  readonly backend: BijouCanvasBackend;
  readonly canvas: C;
  readonly presenter: BijouCanvasPresenter;
  readonly fallbackReasons: readonly BijouCanvasFallbackReason[];
}

type Attempt<C extends BijouCanvasElement> =
  | { readonly ok: true; readonly result: Omit<LadderResult<C>, 'fallbackReasons'> }
  | { readonly ok: false; readonly reason: BijouCanvasFallbackReason };

/**
 * Try one backend on a fresh canvas. A canvas binds one context type for
 * life, so a failed canvas is removed and never reused.
 */
async function attempt<C extends BijouCanvasElement>(
  request: LadderRequest<C>,
  backend: BijouCanvasBackend,
  forced: boolean,
): Promise<Attempt<C>> {
  const factory = request.presenters[backend];
  if (factory === undefined) {
    const reason = `no ${backend} presenter factory was supplied`;
    if (forced) throw new BijouCanvasError('BIJOU_WEB_CANVAS_NO_FACTORY', reason);
    return { ok: false, reason: { backend, code: 'BIJOU_WEB_CANVAS_NO_FACTORY', reason } };
  }
  const canvas = request.createCanvas();
  styleNode(canvas, 'canvas');
  request.container.appendChild(canvas);
  let presenter: BijouCanvasPresenter | undefined;
  try {
    presenter = await factory(canvas, { backend, signal: request.token });
    if (request.token.aborted) throw abortedError();
    presenter.resize(request.size());
    return { ok: true, result: { backend, canvas, presenter } };
  } catch (error: unknown) {
    presenter?.dispose();
    detachNode(request.container, canvas);
    if (request.token.aborted) throw abortedError();
    if (forced || !request.isUnavailable(error)) throw error;
    return { ok: false, reason: { backend, code: errorCode(error), reason: errorReason(error) } };
  }
}

/**
 * Create a presenter for `request.choice`. `'auto'` walks the ladder and
 * falls past a backend only when it is unavailable; a renderer fault, an
 * abort, or any failure of a forced backend is thrown as it is.
 */
export async function negotiateBackend<C extends BijouCanvasElement>(request: LadderRequest<C>): Promise<LadderResult<C>> {
  const forced = request.choice !== 'auto';
  const order = request.choice === 'auto' ? BIJOU_CANVAS_LADDER : [request.choice];
  const fallbackReasons: BijouCanvasFallbackReason[] = [];
  for (const backend of order) {
    if (request.token.aborted) throw abortedError();
    const outcome = await attempt(request, backend, forced);
    if (outcome.ok) return { ...outcome.result, fallbackReasons };
    fallbackReasons.push(outcome.reason);
  }
  throw new BijouCanvasError(
    'BIJOU_WEB_CANVAS_NO_BACKEND',
    `no backend could start: ${fallbackReasons.map((entry) => `${entry.backend}: ${entry.reason}`).join('; ')}`,
    fallbackReasons,
  );
}
