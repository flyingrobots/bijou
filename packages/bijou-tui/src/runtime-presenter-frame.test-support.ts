import {
  isPackedSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';

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

export function isDirty(words: readonly number[], index: number): boolean {
  return ((words[index >> 5] ?? 0) & (1 << (index & 31))) !== 0;
}

/** Copy one frame while both Surfaces still hold it. */
export function copyFrame(
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
