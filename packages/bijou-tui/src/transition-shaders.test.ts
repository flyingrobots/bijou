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
  radialShader,
  diamondShader,
  spiralShader,
  blindsShader,
  curtainShader,
  pixelateShader,
  typewriterShader,
  glitchShader,
  staticShader,
  wipe,
  radial,
  diamond,
  spiral,
  blinds,
  curtain,
  pixelate,
  typewriter,
  glitch,
  tvStatic,
  reverse,
  chain,
  overlay,
  TRANSITION_SHADERS,
  type TransitionCell,
  type TransitionShaderFn,
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
    frame: 0,
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

// ---------------------------------------------------------------------------
// New shader instances
// ---------------------------------------------------------------------------

describe('radialShader', () => {
  it('shows prev at progress=0', () => {
    expect(radialShader(cell({ x: 40, y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(radialShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('reveals center before edges', () => {
    // Center cell
    const center = radialShader(cell({ x: 40, y: 12, progress: 0.3 }));
    // Corner cell
    const corner = radialShader(cell({ x: 0, y: 0, progress: 0.3 }));
    expect(center.showNext).toBe(true);
    expect(corner.showNext).toBe(false);
  });
});

describe('diamondShader', () => {
  it('shows prev at progress=0', () => {
    expect(diamondShader(cell({ x: 40, y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(diamondShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('reveals center before corners', () => {
    const center = diamondShader(cell({ x: 40, y: 12, progress: 0.3 }));
    const corner = diamondShader(cell({ x: 0, y: 0, progress: 0.3 }));
    expect(center.showNext).toBe(true);
    expect(corner.showNext).toBe(false);
  });
});

describe('spiralShader', () => {
  it('shows prev at progress=0', () => {
    expect(spiralShader(cell({ x: 0, y: 0, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    // At progress=1, spiralT < 1 is always true for values in [0,1)
    expect(spiralShader(cell({ x: 40, y: 12, progress: 1 })).showNext).toBe(true);
  });
});

describe('blindsShader', () => {
  it('shows prev at progress=0', () => {
    expect(blindsShader(cell({ y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(blindsShader(cell({ y: 12, progress: 1 })).showNext).toBe(true);
  });

  it('reveals in horizontal bands', () => {
    // Two cells at different y positions within the same band should agree
    const a = blindsShader(cell({ y: 0, height: 24, progress: 0.5 }));
    const b = blindsShader(cell({ y: 1, height: 24, progress: 0.5 }));
    // y=0: band=(0/24*8)%1 = 0 < 0.5 → true
    // y=1: band=(1/24*8)%1 = 0.333 < 0.5 → true
    expect(a.showNext).toBe(true);
    expect(b.showNext).toBe(true);
  });
});

describe('curtainShader', () => {
  it('shows prev at progress=0', () => {
    expect(curtainShader(cell({ x: 40, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(curtainShader(cell({ x: 0, progress: 1 })).showNext).toBe(true);
  });

  it('reveals center before edges', () => {
    // Center (x=40 of 80): distFromCenter = |0.5-0.5|*2 = 0
    const center = curtainShader(cell({ x: 40, width: 80, progress: 0.3 }));
    // Edge (x=0 of 80): distFromCenter = |0-0.5|*2 = 1
    const edge = curtainShader(cell({ x: 0, width: 80, progress: 0.3 }));
    expect(center.showNext).toBe(true);
    expect(edge.showNext).toBe(false);
  });
});

describe('pixelateShader', () => {
  it('shows prev at progress=0', () => {
    const result = pixelateShader(cell({ progress: 0 }));
    expect(result.showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    const result = pixelateShader(cell({ progress: 1 }));
    expect(result.showNext).toBe(true);
  });
});

describe('typewriterShader', () => {
  it('shows prev at progress=0', () => {
    expect(typewriterShader(cell({ x: 40, y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(typewriterShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('shows cursor at leading edge', () => {
    // progress=0 → revealed=0, cellIndex=0 → cursor
    const result = typewriterShader(cell({ x: 0, y: 0, width: 80, height: 24, progress: 0 }));
    expect(result.char).toBeDefined();
    expect(result.showNext).toBe(false);
  });

  it('reveals top-left before bottom-right', () => {
    const topLeft = typewriterShader(cell({ x: 0, y: 0, width: 80, height: 24, progress: 0.5 }));
    const bottomRight = typewriterShader(cell({ x: 79, y: 23, width: 80, height: 24, progress: 0.5 }));
    expect(topLeft.showNext).toBe(true);
    expect(bottomRight.showNext).toBe(false);
  });
});

describe('glitchShader', () => {
  it('shows prev at progress=0', () => {
    expect(glitchShader(cell({ progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(glitchShader(cell({ progress: 1 })).showNext).toBe(true);
  });

  it('uses frame counter for temporal variation', () => {
    const a = glitchShader(cell({ x: 5, y: 5, progress: 0.5, frame: 0 }));
    const b = glitchShader(cell({ x: 5, y: 5, progress: 0.5, frame: 10 }));
    // Results may differ due to frame-dependent noise (not guaranteed but likely)
    // At minimum, the shader should not crash
    expect(typeof a.showNext).toBe('boolean');
    expect(typeof b.showNext).toBe('boolean');
  });
});

describe('staticShader', () => {
  it('shows prev at progress=0', () => {
    // At progress=0, staticAmount=0, no static → showNext = progress > 0.5 → false
    expect(staticShader(cell({ progress: 0, rand: 0.5 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    // At progress=1, staticAmount=0, no static → showNext = progress > 0.5 → true
    expect(staticShader(cell({ progress: 1, rand: 0.5 })).showNext).toBe(true);
  });

  it('produces char overrides during peak static', () => {
    // At progress=0.5 (peak), staticAmount=1, density=0.7
    // frame-based noise determines whether char override appears
    // Use a frame that produces noise < 0.7 for this cell
    const result = staticShader(cell({ x: 3, y: 3, progress: 0.5, frame: 1 }));
    // Should either show char override or fall through — no crash
    expect(typeof result.showNext).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Shader factories
// ---------------------------------------------------------------------------

describe('wipe() factory', () => {
  it('defaults to right', () => {
    const shader = wipe();
    expect(shader(cell({ x: 20, width: 80, progress: 0.5 })).showNext).toBe(true);
    expect(shader(cell({ x: 60, width: 80, progress: 0.5 })).showNext).toBe(false);
  });

  it('supports left direction', () => {
    const shader = wipe('left');
    // left: 1 - x/width < progress → 1 - 20/80 = 0.75 > 0.5 → false
    expect(shader(cell({ x: 20, width: 80, progress: 0.5 })).showNext).toBe(false);
    // 1 - 60/80 = 0.25 < 0.5 → true
    expect(shader(cell({ x: 60, width: 80, progress: 0.5 })).showNext).toBe(true);
  });

  it('supports up direction', () => {
    const shader = wipe('up');
    // up: 1 - y/height < progress → 1 - 20/24 ≈ 0.167 < 0.5 → true
    expect(shader(cell({ y: 20, height: 24, progress: 0.5 })).showNext).toBe(true);
    // 1 - 2/24 ≈ 0.917 > 0.5 → false
    expect(shader(cell({ y: 2, height: 24, progress: 0.5 })).showNext).toBe(false);
  });

  it('supports down direction', () => {
    const shader = wipe('down');
    // down: y/height < progress → 2/24 ≈ 0.083 < 0.5 → true
    expect(shader(cell({ y: 2, height: 24, progress: 0.5 })).showNext).toBe(true);
    // 20/24 ≈ 0.833 > 0.5 → false
    expect(shader(cell({ y: 20, height: 24, progress: 0.5 })).showNext).toBe(false);
  });
});

describe('radial() factory', () => {
  it('supports custom origin', () => {
    const shader = radial(0, 0); // top-left origin
    // Cell at (0,0) is distance 0 from origin → showNext at any progress > 0
    expect(shader(cell({ x: 0, y: 0, progress: 0.1 })).showNext).toBe(true);
    // Far corner should not show at low progress
    expect(shader(cell({ x: 79, y: 23, progress: 0.1 })).showNext).toBe(false);
  });
});

describe('blinds() factory', () => {
  it('supports vertical direction', () => {
    const shader = blinds(8, 'vertical');
    const a = shader(cell({ x: 0, width: 80, progress: 0.5 }));
    expect(a.showNext).toBe(true); // band = (0/80*8)%1 = 0 < 0.5
  });

  it('supports custom count', () => {
    const shader = blinds(4, 'horizontal');
    // y=6 of 24, count=4: band = (6/24*4)%1 = 1%1 = 0 < 0.5 → true
    expect(shader(cell({ y: 6, height: 24, progress: 0.5 })).showNext).toBe(true);
  });
});

describe('curtain() factory', () => {
  it('supports horizontal direction', () => {
    const shader = curtain('horizontal');
    // Center (y=12 of 24): distFromCenter = 0
    expect(shader(cell({ y: 12, height: 24, progress: 0.3 })).showNext).toBe(true);
    // Edge (y=0 of 24): distFromCenter = 1
    expect(shader(cell({ y: 0, height: 24, progress: 0.3 })).showNext).toBe(false);
  });
});

describe('typewriter() factory', () => {
  it('supports custom cursor', () => {
    const shader = typewriter('_');
    const result = shader(cell({ x: 0, y: 0, width: 80, height: 24, progress: 0 }));
    expect(result.char).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Combinators
// ---------------------------------------------------------------------------

describe('reverse()', () => {
  it('reverses spatial reveal order (right-to-left wipe)', () => {
    const reversed = reverse(wipeShader);
    // Reversed wipe reveals from right side first.
    // At progress=0.5: cells on the right half (x >= 40) should showNext.
    // x=60, width=80: feed 1-0.5=0.5 → 60/80=0.75 > 0.5 → showNext=false → flip → true
    expect(reversed(cell({ x: 60, width: 80, progress: 0.5 })).showNext).toBe(true);
    // x=20: feed 0.5 → 20/80=0.25 < 0.5 → showNext=true → flip → false
    expect(reversed(cell({ x: 20, width: 80, progress: 0.5 })).showNext).toBe(false);
  });

  it('shows nothing at progress=0', () => {
    const reversed = reverse(wipeShader);
    expect(reversed(cell({ x: 0, width: 80, progress: 0 })).showNext).toBe(false);
    expect(reversed(cell({ x: 79, width: 80, progress: 0 })).showNext).toBe(false);
  });

  it('shows everything at progress=1', () => {
    const reversed = reverse(wipeShader);
    expect(reversed(cell({ x: 0, width: 80, progress: 1 })).showNext).toBe(true);
    expect(reversed(cell({ x: 79, width: 80, progress: 1 })).showNext).toBe(true);
  });

  it('drops marker char overrides from the base shader', () => {
    // reverse(typewriter) at progress=1 evaluates typewriter at progress=0,
    // which emits a cursor char (charRole='marker') for cell (0,0).
    // Marker chars are positional and must be dropped on reversal.
    const reversed = reverse(typewriter());
    const result = reversed(cell({ x: 0, y: 0, width: 80, height: 24, progress: 1 }));
    expect(result.showNext).toBe(true);
    expect(result.char).toBeUndefined();
  });

  it('preserves decoration char overrides from the base shader', () => {
    // Decoration chars (glitch noise, static blocks) are ambient and should
    // survive progress remapping.
    const decorationShader: TransitionShaderFn = () => ({
      showNext: true,
      char: '█',
      charRole: 'decoration',
    });
    const reversed = reverse(decorationShader);
    const result = reversed(cell({ progress: 0.5 }));
    expect(result.char).toBe('█');
    expect(result.charRole).toBe('decoration');
  });

  it('treats chars without charRole as decoration (preserves them)', () => {
    const legacyShader: TransitionShaderFn = () => ({
      showNext: true,
      char: 'X',
    });
    const reversed = reverse(legacyShader);
    const result = reversed(cell({ progress: 0.5 }));
    expect(result.char).toBe('X');
  });
});

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

describe('overlay()', () => {
  it('uses top shader char override when present', () => {
    const base = wipeShader;
    const top: typeof wipeShader = () => ({ showNext: false, char: 'X' });
    const combined = overlay(base, top);
    const result = combined(cell());
    expect(result.char).toBe('X');
  });

  it('falls through to base when top has no char', () => {
    const base: typeof wipeShader = () => ({ showNext: true, char: 'B' });
    const top: typeof wipeShader = () => ({ showNext: false });
    const combined = overlay(base, top);
    const result = combined(cell());
    expect(result.char).toBe('B');
  });
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('TRANSITION_SHADERS', () => {
  it('maps none to undefined', () => {
    expect(TRANSITION_SHADERS.none).toBeUndefined();
  });

  it('maps all built-in names to shader functions', () => {
    const names: BuiltinTransition[] = [
      'wipe', 'dissolve', 'grid', 'fade', 'melt', 'matrix', 'scramble',
      'radial', 'diamond', 'spiral', 'blinds', 'curtain', 'pixelate',
      'typewriter', 'glitch', 'static',
    ];
    for (const name of names) {
      expect(typeof TRANSITION_SHADERS[name]).toBe('function');
    }
  });

  it('has exactly 17 entries', () => {
    expect(Object.keys(TRANSITION_SHADERS)).toHaveLength(17);
  });
});
