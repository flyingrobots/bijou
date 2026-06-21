import { describe, it, expect } from 'vitest';
import { sequence } from './animate.js';
import type { CmdCapabilities } from './types.js';

/** Create mock capabilities that can be manually pulsed. */
function createMockCaps(): CmdCapabilities & { pulse(dt: number): void } {
  const handlers = new Set<(dt: number) => void>();
  return {
    onPulse: (h) => {
      handlers.add(h);
      return { dispose: () => handlers.delete(h) };
    },
    pulse: (dt) => {
      for (const h of handlers) h(dt);
    },
  };
}

describe('sequence', () => {
  it('runs commands in order', async () => {
    const order: string[] = [];
    const caps = createMockCaps();
    const cmd = sequence<string>(
      (emit) => { order.push('first'); emit('a'); return undefined; },
      (emit) => { order.push('second'); emit('b'); return undefined; },
    );
    const emitted: string[] = [];
    await cmd((msg) => emitted.push(msg), caps);
    expect(order).toEqual(['first', 'second']);
    expect(emitted).toEqual(['a', 'b']);
  });
});
