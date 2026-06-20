import type { createTestContext, mockClock } from '@flyingrobots/bijou/adapters/test';

export function scheduleKeys(
  ctx: ReturnType<typeof createTestContext>,
  clock: ReturnType<typeof mockClock>,
  events: { at: number; key: string }[],
): void {
  ctx.io.rawInput = (onKey) => {
    const handles = events.map(({ at, key }) => clock.setTimeout(() => { onKey(key); }, at));
    return {
      dispose() {
        handles.forEach((handle) => {
          handle.dispose();
        });
      },
    };
  };
}

export function scheduleResizes(
  ctx: ReturnType<typeof createTestContext>,
  clock: ReturnType<typeof mockClock>,
  events: { at: number; columns: number; rows: number }[],
): void {
  ctx.io.onResize = (onResize) => {
    const handles = events.map(({ at, columns, rows }) =>
      clock.setTimeout(() => { onResize(columns, rows); }, at)
    );
    return {
      dispose() {
        handles.forEach((handle) => {
          handle.dispose();
        });
      },
    };
  };
}
