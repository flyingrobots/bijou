import { describe, expect, it } from 'vitest';
import { createRuntimeStateMachine, transitionRuntimeState } from './runtime-engine.js';

describe('runtime state machine', () => {
  it('tracks current and previous state across explicit transitions', () => {
    const machine = createRuntimeStateMachine({
      id: 'session.active',
      sessionId: 'abc',
    });
    const next = transitionRuntimeState(machine, {
      id: 'session.ended',
      sessionId: 'abc',
    });
    expect(machine.current.id).toBe('session.active');
    expect(machine.previous).toBeUndefined();
    expect(next.current.id).toBe('session.ended');
    expect(next.previous?.id).toBe('session.active');
    expect(next.transitionCount).toBe(1);
  });
});
