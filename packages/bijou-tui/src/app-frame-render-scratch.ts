import { createSurface, type Surface } from '@flyingrobots/bijou';

/** Per-size scratch surface pool for pane rendering. */
export type FramePaneScratchPool = Map<string, Surface>;

export function createFramePaneScratchPool(): FramePaneScratchPool {
  return new Map();
}

export function getFramePaneScratch(
  pool: FramePaneScratchPool,
  width: number,
  height: number,
): Surface {
  const key = `${String(width)}x${String(height)}`;
  let scratch = pool.get(key);
  if (scratch == null) {
    scratch = createSurface(width, height);
    pool.set(key, scratch);
  }
  return scratch;
}

export function required<T>(value: T | null | undefined, label: string): T {
  if (value == null) {
    throw new Error(`createFramedApp: ${label} is not registered`);
  }
  return value;
}
