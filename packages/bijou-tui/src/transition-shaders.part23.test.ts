import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { wipeShader, dissolveShader, chain, type TransitionCell } from './transition-shaders.js';

const ctx = createTestContext({ mode: 'interactive' });

function cell(overrides: Partial<TransitionCell> = {}): TransitionCell {
  return {
    x: 0,
    y: 0,
    width: 80,
    height: 24,
    progress: 0.5,
    rand: 0.5,
    frame: 0,
    ctx,
    ...overrides,
  };
}

describe('chain()', () => {
  it('uses first shader for first half', () => {
    const chained = chain(wipeShader, dissolveShader);
    // At progress=0.25, first shader gets progress=0.5
    const result = chained(cell({ x: 20, width: 80, progress: 0.25 }));
    // wipeShader at progress=0.5: 20/80=0.25 < 0.5 → true
    expect(result.showNext).toBe(true);
  });

  it('uses second shader for second half', () => {
    const chained = chain(wipeShader, dissolveShader);
    // At progress=0.75, second shader gets progress=0.5
    const result = chained(cell({ rand: 0.3, progress: 0.75 }));
    // dissolveShader at progress=0.5: 0.3 < 0.5 → true
    expect(result.showNext).toBe(true);
  });
});
