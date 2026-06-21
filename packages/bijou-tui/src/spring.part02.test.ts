import { describe, it, expect } from 'vitest';
import { createSpringState } from './spring.js';

describe('createSpringState', () => {
  it('creates state at the given value with zero velocity', () => {
    const state = createSpringState(50);
    expect(state.value).toBe(50);
    expect(state.velocity).toBe(0);
    expect(state.done).toBe(false);
  });
});
