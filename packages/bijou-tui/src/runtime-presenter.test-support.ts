import type { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  copyFrame,
  type PresentedFrame,
} from './runtime-presenter-frame.test-support.js';
import type { SurfacePresenter } from './surface-presenter.js';

export { isDirty } from './runtime-presenter-frame.test-support.js';
export type { PresentedFrame };

/** Raw terminal input for the arrow keys that `counterApp()` reads. */
export const UP = '\x1b[A';
export const DOWN = '\x1b[B';

export type PresenterEvent =
  | { readonly kind: 'enter' }
  | { readonly kind: 'exit' }
  | { readonly kind: 'resize'; readonly cols: number; readonly rows: number }
  | { readonly kind: 'present'; readonly frame: PresentedFrame };

export interface RecordingPresenter {
  readonly presenter: Required<SurfacePresenter>;
  readonly events: PresenterEvent[];
  kinds(): string[];
  frames(): PresentedFrame[];
}

/** Errors that the fake host throws instead of recording the call. */
export interface PresenterFaults {
  readonly enter?: Error;
  readonly exit?: Error;
  readonly onResize?: Error;
  /** Receives the 1-based `present()` call number. */
  readonly present?: (call: number) => Error | undefined;
}

/** In-memory fake host: it copies every frame while `present()` runs. */
export function recordingPresenter(
  faults: PresenterFaults = {},
): RecordingPresenter {
  const events: PresenterEvent[] = [];
  let presentCalls = 0;
  return {
    events,
    kinds: () => events.map((event) => event.kind),
    frames: () => events.flatMap((event) =>
      event.kind === 'present' ? [event.frame] : []),
    presenter: {
      enter() {
        raise(faults.enter);
        events.push({ kind: 'enter' });
      },
      exit() {
        raise(faults.exit);
        events.push({ kind: 'exit' });
      },
      onResize(cols, rows) {
        raise(faults.onResize);
        events.push({ kind: 'resize', cols, rows });
      },
      present(current, target, ctx) {
        presentCalls += 1;
        raise(faults.present?.(presentCalls));
        events.push({ kind: 'present', frame: copyFrame(current, target, ctx) });
      },
    },
  };
}

/** Record `writeBytes` calls so a test can prove that none happened. */
export function captureByteWrites(
  ctx: ReturnType<typeof createTestContext>,
): number[] {
  const lengths: number[] = [];
  ctx.io.writeBytes = (_bytes, length) => {
    lengths.push(length);
  };
  return lengths;
}

function raise(fault: Error | undefined): void {
  if (fault !== undefined) throw fault;
}
