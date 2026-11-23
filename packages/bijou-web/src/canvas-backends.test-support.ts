import type {
  BijouCanvasBackend, BijouCanvasPresenter, BijouCanvasPresenterFactory, BijouCanvasPresenters, BijouCanvasResize,
} from './canvas-contract.js';
import type { FakeCanvas, FakeContextKind } from './canvas-dom.test-support.js';

/** Shaped like Geordi's `BackendUnavailableError`: the mount reads only `code` and `reason`. */
export class FakeBackendUnavailableError extends Error {
  readonly code = 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE';
  constructor(readonly backend: BijouCanvasBackend, readonly reason: string) {
    super(`GEORDI_E_BIJOU_BACKEND_UNAVAILABLE: ${backend} is unavailable: ${reason}`);
    this.name = 'BackendUnavailableError';
  }
}

/** Shaped like Geordi's `RendererFaultError`. */
export class FakeRendererFaultError extends Error {
  readonly code = 'GEORDI_E_BIJOU_RENDERER_FAULT';
  constructor(readonly backend: BijouCanvasBackend, readonly detail: string) {
    super(`GEORDI_E_BIJOU_RENDERER_FAULT: ${backend} renderer fault: ${detail}`);
    this.name = 'RendererFaultError';
  }
}

/**
 * What a fake factory does: create a presenter, refuse before or after it
 * binds a context, fault, or wait until the test resolves it.
 */
export type FakeOutcome = 'ok' | 'unavailable' | 'unavailable-after-context' | 'fault' | 'deferred';

/** One frame a fake presenter received. */
export interface FakePresent {
  readonly force: boolean;
  readonly width: number;
  readonly height: number;
  /** Cells whose target dirty bit is set. */
  readonly dirty: number;
}

/** A presenter a fake factory created. */
export interface FakePresenterRecord {
  readonly backend: BijouCanvasBackend;
  readonly canvas: FakeCanvas;
  readonly presents: FakePresent[];
  readonly resizes: BijouCanvasResize[];
  disposed: boolean;
}

/** Fake presenter factories and everything they did. */
export interface FakeBackends {
  readonly presenters: BijouCanvasPresenters<FakeCanvas>;
  readonly outcomes: Record<BijouCanvasBackend, FakeOutcome>;
  readonly attempts: string[];
  readonly created: FakePresenterRecord[];
  /** Resolve every deferred factory call that is still waiting. */
  resolveDeferred(): void;
  /** Presenters created and not disposed. */
  live(): number;
}

const CONTEXT: Record<BijouCanvasBackend, FakeContextKind> = { webgpu: 'webgpu', webgl2: 'webgl2', canvas2d: '2d' };

function countBits(words: Uint32Array): number {
  let count = 0;
  for (const word of words) for (let bits = word; bits !== 0; bits &= bits - 1) count++;
  return count;
}

/** Create fake factories for all three backends; every outcome starts as `'ok'`. */
export function createFakeBackends(): FakeBackends {
  const outcomes: Record<BijouCanvasBackend, FakeOutcome> = { webgpu: 'ok', webgl2: 'ok', canvas2d: 'ok' };
  const attempts: string[] = [];
  const created: FakePresenterRecord[] = [];
  const waiting: (() => void)[] = [];
  const build = (backend: BijouCanvasBackend, canvas: FakeCanvas): BijouCanvasPresenter => {
    if (canvas.getContext(CONTEXT[backend]) === null) {
      throw new FakeBackendUnavailableError(backend, `canvas #${String(canvas.id)} is bound to ${String(canvas.bound())}`);
    }
    if (outcomes[backend] === 'unavailable-after-context') throw new FakeBackendUnavailableError(backend, 'device lost at configure');
    if (outcomes[backend] === 'fault') throw new FakeRendererFaultError(backend, 'shader failed to compile');
    const record: FakePresenterRecord = { backend, canvas, presents: [], resizes: [], disposed: false };
    created.push(record);
    return {
      present(_current, target, ctx) {
        record.presents.push({
          force: ctx.forceFullRefresh === true, width: target.width, height: target.height,
          dirty: countBits(target.renderDirtyWords),
        });
      },
      resize(size) { record.resizes.push(size); },
      dispose() { record.disposed = true; },
    };
  };
  const factory = (backend: BijouCanvasBackend): BijouCanvasPresenterFactory<FakeCanvas> => (canvas) => {
    attempts.push(`${backend}#${String(canvas.id)}`);
    if (outcomes[backend] === 'unavailable') throw new FakeBackendUnavailableError(backend, `no ${backend} on this host`);
    if (outcomes[backend] !== 'deferred') return build(backend, canvas);
    return new Promise((resolve, reject) => {
      waiting.push(() => {
        try { resolve(build(backend, canvas)); } catch (error: unknown) { reject(error instanceof Error ? error : new Error(String(error))); }
      });
    });
  };
  return {
    presenters: { webgpu: factory('webgpu'), webgl2: factory('webgl2'), canvas2d: factory('canvas2d') },
    outcomes,
    attempts,
    created,
    resolveDeferred() { for (const resolve of waiting.splice(0)) resolve(); },
    live: () => created.filter((record) => !record.disposed).length,
  };
}
