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
// remove
// ---------------------------------------------------------------------------

describe('remove', () => {
  it('removes a layer by ID', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const id1 = stack.push(handler({}), { name: 'base' });
    stack.push(handler({}), { name: 'top' });

    expect(stack.remove(id1)).toBe(true);
    expect(stack.size).toBe(1);
    expect(stack.layers()[0]?.name).toBe('top');
  });

  it('returns false for unknown ID', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.remove(999)).toBe(false);
  });
});
