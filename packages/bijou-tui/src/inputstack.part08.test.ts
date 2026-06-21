import { describe, it, expect } from 'vitest';
import { createInputStack, type InputHandler } from './inputstack.js';
import type { KeyMsg } from './types.js';

type Msg =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string }
  | { type: 'confirm' }
  | { type: 'cancel' };

/** Simple inline handler for tests. */
function handler(map: Record<string, Msg>): InputHandler<KeyMsg, Msg> {
  return {
    handle(msg) {
      return map[msg.key];
    },
  };
}

// ---------------------------------------------------------------------------
// layers()
// ---------------------------------------------------------------------------

describe('layers()', () => {
  it('returns layers bottom to top', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({}), { name: 'base', passthrough: true });
    stack.push(handler({}), { name: 'modal' });

    const info = stack.layers();
    expect(info).toHaveLength(2);
    expect(info[0]?.name).toBe('base');
    expect(info[0]?.passthrough).toBe(true);
    expect(info[1]?.name).toBe('modal');
    expect(info[1]?.passthrough).toBe(false);
  });
});
