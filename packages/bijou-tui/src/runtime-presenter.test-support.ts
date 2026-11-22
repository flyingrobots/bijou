import {
  isPackedSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import type { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { SurfacePresenter } from './surface-presenter.js';

/** A frame copied inside `present()`, before the runtime swaps framebuffers. */
export interface PresentedFrame {
  readonly current: Surface;
  readonly target: Surface;
  readonly ctx: BijouContext;
  readonly columns: number;
  readonly rows: number;
  readonly currentText: string;
  readonly targetText: string;
  readonly currentDirty: readonly number[];
  readonly targetDirty: readonly number[];
  /** Cells that differ but that neither render-dirty bitmap marks. */
  readonly unmarkedChanges: readonly number[];
  /** Target cells marked render-dirty that the frame did not paint. */
  readonly staleTargetBits: readonly number[];
}

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

/** In-memory fake host: it copies every frame while `present()` runs. */
export function recordingPresenter(): RecordingPresenter {
  const events: PresenterEvent[] = [];
  return {
    events,
    kinds: () => events.map((event) => event.kind),
    frames: () => events.flatMap((event) =>
      event.kind === 'present' ? [event.frame] : []),
    presenter: {
      enter() {
        events.push({ kind: 'enter' });
      },
      exit() {
        events.push({ kind: 'exit' });
      },
      onResize(cols, rows) {
        events.push({ kind: 'resize', cols, rows });
      },
      present(current, target, ctx) {
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

export function isDirty(words: readonly number[], index: number): boolean {
  return ((words[index >> 5] ?? 0) & (1 << (index & 31))) !== 0;
}

function copyFrame(
  current: Surface,
  target: Surface,
  ctx: BijouContext,
): PresentedFrame {
  const currentDirty = dirtyWords(current);
  const targetDirty = dirtyWords(target);
  const unmarkedChanges: number[] = [];
  const staleTargetBits: number[] = [];
  for (let index = 0; index < target.width * target.height; index++) {
    const x = index % target.width;
    const y = Math.floor(index / target.width);
    const marked = isDirty(currentDirty, index) || isDirty(targetDirty, index);
    if (!marked && cellKey(current, x, y) !== cellKey(target, x, y)) {
      unmarkedChanges.push(index);
    }
    if (isDirty(targetDirty, index) && target.get(x, y).empty) {
      staleTargetBits.push(index);
    }
  }
  return {
    current,
    target,
    ctx,
    columns: target.width,
    rows: target.height,
    currentText: surfaceText(current),
    targetText: surfaceText(target),
    currentDirty,
    targetDirty,
    unmarkedChanges,
    staleTargetBits,
  };
}

function dirtyWords(surface: Surface): number[] {
  return isPackedSurface(surface) ? Array.from(surface.renderDirtyWords) : [];
}

function cellKey(surface: Surface, x: number, y: number): string {
  if (x >= surface.width || y >= surface.height) return 'outside';
  const cell = surface.get(x, y);
  return cell.empty ? 'empty' : `char:${cell.char}`;
}

function surfaceText(surface: Surface): string {
  const rows: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let row = '';
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      row += cell.empty ? ' ' : cell.char;
    }
    rows.push(row.trimEnd());
  }
  return rows.join('\n').trimEnd();
}
