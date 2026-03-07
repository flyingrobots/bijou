import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  wipeShader,
  dissolveShader,
  gridShader,
  fadeShader,
  meltShader,
  matrixShader,
  scrambleShader,
  TRANSITION_SHADERS,
  type TransitionCell,
  type BuiltinTransition,
} from './transition-shaders.js';

const ctx = createTestContext({ mode: 'interactive' });

function cell(overrides: Partial<TransitionCell> = {}): TransitionCell {
  return {
    x: 0,
    y: 0,
    width: 80,
    height: 24,
    progress: 0.5,
    rand: 0.5,
    ctx,
    ...overrides,
  };
}

describe('wipeShader', () => {
  it('shows prev at progress=0', () => {
    expect(wipeShader(cell({ x: 40, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(wipeShader(cell({ x: 79, progress: 1 })).showNext).toBe(true);
  });

  it('wipes left-to-right based on x/width vs progress', () => {
    // x=20, width=80 → 0.25 < 0.5 → showNext
    expect(wipeShader(cell({ x: 20, progress: 0.5 })).showNext).toBe(true);
    // x=60, width=80 → 0.75 > 0.5 → showPrev
    expect(wipeShader(cell({ x: 60, progress: 0.5 })).showNext).toBe(false);
  });
});

describe('dissolveShader', () => {
  it('shows prev at progress=0', () => {
    expect(dissolveShader(cell({ rand: 0.5, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(dissolveShader(cell({ rand: 0.99, progress: 1 })).showNext).toBe(true);
  });

  it('dissolves based on rand vs progress', () => {
    expect(dissolveShader(cell({ rand: 0.3, progress: 0.5 })).showNext).toBe(true);
    expect(dissolveShader(cell({ rand: 0.7, progress: 0.5 })).showNext).toBe(false);
  });
});

describe('gridShader', () => {
  it('shows prev at progress=0', () => {
    expect(gridShader(cell({ x: 0, y: 0, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(gridShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('uses 8x4 block grid pattern', () => {
    // gx=0, gy=0 → (0+0)%10=0, 0/10=0 < 0.5 → showNext
    expect(gridShader(cell({ x: 0, y: 0, progress: 0.5 })).showNext).toBe(true);
    // gx=1, gy=1 → (1+1)%10=2, 2/10=0.2 < 0.5 → showNext
    expect(gridShader(cell({ x: 8, y: 4, progress: 0.5 })).showNext).toBe(true);
    // gx=5, gy=2 → (5+2)%10=7, 7/10=0.7 > 0.5 → showPrev
    expect(gridShader(cell({ x: 40, y: 8, progress: 0.5 })).showNext).toBe(false);
  });
});

describe('fadeShader', () => {
  it('shows prev at progress=0', () => {
    expect(fadeShader(cell({ progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(fadeShader(cell({ progress: 1 })).showNext).toBe(true);
  });

  it('hard-cuts at midpoint', () => {
    expect(fadeShader(cell({ progress: 0.49 })).showNext).toBe(false);
    expect(fadeShader(cell({ progress: 0.51 })).showNext).toBe(true);
  });
});

describe('meltShader', () => {
  it('shows prev at progress=0', () => {
    expect(meltShader(cell({ x: 0, y: 12, height: 24, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1 for all rows', () => {
    // At progress=1, dropStart = 1.4 - variability (max 0.4) = min 1.0
    // y/height max = 23/24 ≈ 0.958 < 1.0 → showNext
    for (let y = 0; y < 24; y++) {
      expect(meltShader(cell({ x: 0, y, height: 24, progress: 1 })).showNext).toBe(true);
    }
  });

  it('melts top-down', () => {
    // Top rows reveal before bottom rows at same x
    const top = meltShader(cell({ x: 0, y: 0, height: 24, progress: 0.5 }));
    const bottom = meltShader(cell({ x: 0, y: 23, height: 24, progress: 0.5 }));
    // If top shows next, bottom may or may not; but top should be at least as advanced
    expect(top.showNext || !bottom.showNext).toBe(true);
  });
});

describe('matrixShader', () => {
  it('shows prev at progress=0', () => {
    const result = matrixShader(cell({ rand: 0.5, progress: 0 }));
    expect(result.showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    const result = matrixShader(cell({ rand: 0.5, progress: 1 }));
    expect(result.showNext).toBe(true);
  });

  it('produces char override at the leading edge', () => {
    // rand just above threshold but within threshold+edge
    const result = matrixShader(cell({ rand: 0.55, progress: 0.5 }));
    expect(result.showNext).toBe(false);
    expect(result.char).toBeDefined();
  });

  it('shows next when rand < threshold', () => {
    const result = matrixShader(cell({ rand: 0.3, progress: 0.5 }));
    expect(result.showNext).toBe(true);
    expect(result.char).toBeUndefined();
  });
});

describe('scrambleShader', () => {
  it('shows prev at progress=0', () => {
    const result = scrambleShader(cell({ rand: 0.5, progress: 0 }));
    expect(result.showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    const result = scrambleShader(cell({ rand: 0.5, progress: 1 }));
    expect(result.showNext).toBe(true);
  });

  it('produces char override at peak scramble (midpoint)', () => {
    // At progress=0.5, scrambleAmount=1, so rand 0.5 < 0.8 → char override
    const result = scrambleShader(cell({ rand: 0.5, progress: 0.5 }));
    expect(result.char).toBeDefined();
  });

  it('resolves to next page past midpoint with high rand', () => {
    // At progress=0.9, scrambleAmount=0.2, rand 0.5 > 0.16 → no override, showNext true
    const result = scrambleShader(cell({ rand: 0.5, progress: 0.9 }));
    expect(result.showNext).toBe(true);
    expect(result.char).toBeUndefined();
  });
});

describe('TRANSITION_SHADERS', () => {
  it('maps none to undefined', () => {
    expect(TRANSITION_SHADERS.none).toBeUndefined();
  });

  it('maps all built-in names to shader functions', () => {
    const names: BuiltinTransition[] = ['wipe', 'dissolve', 'grid', 'fade', 'melt', 'matrix', 'scramble'];
    for (const name of names) {
      expect(typeof TRANSITION_SHADERS[name]).toBe('function');
    }
  });

  it('has exactly 8 entries', () => {
    expect(Object.keys(TRANSITION_SHADERS)).toHaveLength(8);
  });
});
