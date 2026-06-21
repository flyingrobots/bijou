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
// push / pop / size
// ---------------------------------------------------------------------------

describe('push / pop / size', () => {
  it('starts empty', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.size).toBe(0);
    expect(stack.layers()).toEqual([]);
  });

  it('push increases size and returns unique IDs', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const id1 = stack.push(handler({}));
    const id2 = stack.push(handler({}));

    expect(stack.size).toBe(2);
    expect(id1).not.toBe(id2);
  });

  it('pop removes and returns the top layer', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({}), { name: 'base' });
    stack.push(handler({}), { name: 'modal' });

    const popped = stack.pop();
    expect(popped?.name).toBe('modal');
    expect(stack.size).toBe(1);
  });

  it('pop returns undefined when empty', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.pop()).toBeUndefined();
  });
});
