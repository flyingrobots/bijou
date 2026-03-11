import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { fromDTCG, toDTCG, type DTCGDocument } from './dtcg.js';
import type { Theme, TextModifier, GradientStop, TokenValue, BaseStatusKey, BaseUiKey, BaseGradientKey } from './tokens.js';

const ALL_MODIFIERS: TextModifier[] = ['bold', 'dim', 'strikethrough', 'inverse', 'underline', 'curly-underline', 'dotted-underline', 'dashed-underline'];
const STATUS_KEYS: BaseStatusKey[] = ['success', 'error', 'warning', 'info', 'pending', 'active', 'muted'];
const UI_KEYS: BaseUiKey[] = ['cursor', 'scrollThumb', 'scrollTrack', 'sectionHeader', 'logo', 'tableHeader', 'trackEmpty'];
const SEMANTIC_KEYS = ['success', 'error', 'warning', 'info', 'accent', 'muted', 'primary'] as const;
const BORDER_KEYS = ['primary', 'secondary', 'success', 'warning', 'error', 'muted'] as const;
const SURFACE_KEYS = ['primary', 'secondary', 'elevated', 'overlay', 'muted'] as const;

/** Generate a valid hex color string. */
const hexColorArb = fc.integer({ min: 0, max: 0xffffff })
  .map((n) => '#' + n.toString(16).padStart(6, '0'));

/** Generate a random modifier subset. */
const modifiersArb = fc.subarray(ALL_MODIFIERS, { minLength: 0, maxLength: 3 });

/** Generate a random TokenValue. */
const tokenArb: fc.Arbitrary<TokenValue> = fc.record({
  hex: hexColorArb,
  modifiers: fc.option(modifiersArb, { nil: undefined }),
  bg: fc.option(hexColorArb, { nil: undefined }),
});

/** Generate a random gradient (1–5 stops). */
const gradientArb: fc.Arbitrary<GradientStop[]> = fc.array(
  fc.record({
    pos: fc.float({ min: 0, max: 1, noNaN: true }),
    color: fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    ) as fc.Arbitrary<[number, number, number]>,
  }),
  { minLength: 1, maxLength: 5 },
);

/** Build a complete Theme from random token values and gradients. */
function buildTheme(
  name: string,
  tokenFn: () => TokenValue,
  gradients: Record<string, GradientStop[]>,
): Theme {
  const makeRecord = <K extends string>(keys: readonly K[]): Record<K, TokenValue> =>
    Object.fromEntries(keys.map((k) => [k, tokenFn()])) as Record<K, TokenValue>;

  return {
    name,
    status: makeRecord(STATUS_KEYS),
    semantic: makeRecord(SEMANTIC_KEYS) as Theme['semantic'],
    gradient: gradients as Record<BaseGradientKey, GradientStop[]>,
    border: makeRecord(BORDER_KEYS) as Theme['border'],
    ui: makeRecord(UI_KEYS),
    surface: makeRecord(SURFACE_KEYS) as Theme['surface'],
  };
}

describe('DTCG fuzz (property-based)', () => {
  it('random themes survive toDTCG → fromDTCG round-trip', () => {
    const themeArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      token: tokenArb,
      brandGradient: gradientArb,
      accentGradient: gradientArb,
    });

    fc.assert(
      fc.property(themeArb, ({ name, token, brandGradient, accentGradient }) => {
        const theme = buildTheme(
          name,
          () => ({ ...token }),
          { brand: brandGradient, accent: accentGradient },
        );
        const doc = toDTCG(theme);
        const restored = fromDTCG(doc);

        expect(restored.name).toBe(name);
        // Verify all status tokens survived
        for (const key of STATUS_KEYS) {
          expect(restored.status[key].hex).toBe(token.hex);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('random hex colors are preserved through round-trip', () => {
    fc.assert(
      fc.property(hexColorArb, (hex) => {
        const theme = buildTheme(
          'test',
          () => ({ hex }),
          { brand: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }], accent: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }] },
        );
        const restored = fromDTCG(toDTCG(theme));
        expect(restored.status.success.hex).toBe(hex);
      }),
      { numRuns: 200 },
    );
  });

  it('modifier subsets are preserved through round-trip', () => {
    fc.assert(
      fc.property(modifiersArb, (mods) => {
        const modList = mods.length > 0 ? mods : undefined;
        const theme = buildTheme(
          'mod-test',
          () => ({ hex: '#ffffff', modifiers: modList }),
          { brand: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }], accent: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }] },
        );
        const restored = fromDTCG(toDTCG(theme));
        const expected = modList ?? [];
        const actual = restored.status.success.modifiers ?? [];
        expect([...actual].sort()).toEqual([...expected].sort());
      }),
      { numRuns: 100 },
    );
  });

  it('deeply nested non-circular reference chains resolve', () => {
    // Build a chain: a → b → c → d → e, all eventually resolving to a hex color
    const depth = 7;
    const doc: DTCGDocument = {
      name: { $type: 'string', $value: 'chain-test' },
      status: {} as any,
      semantic: {} as any,
      gradient: { brand: { $type: 'gradient', $value: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }] } },
      border: {} as any,
      ui: {} as any,
      surface: {} as any,
    };

    // Create chain tokens in status: chain_0 → chain_1 → ... → chain_N (concrete)
    const statusGroup = doc['status'] as Record<string, unknown>;
    for (let i = 0; i < depth - 1; i++) {
      statusGroup[`chain_${i}`] = { $type: 'color', $value: `{status.chain_${i + 1}}` };
    }
    statusGroup[`chain_${depth - 1}`] = { $type: 'color', $value: '#abcdef' };

    // Fill required status keys
    for (const key of STATUS_KEYS) {
      if (!(key in statusGroup)) {
        statusGroup[key] = { $type: 'color', $value: '{status.chain_0}' };
      }
    }

    // Fill other required groups with concrete values
    for (const key of SEMANTIC_KEYS) {
      (doc['semantic'] as Record<string, unknown>)[key] = { $type: 'color', $value: '#000000' };
    }
    for (const key of BORDER_KEYS) {
      (doc['border'] as Record<string, unknown>)[key] = { $type: 'color', $value: '#000000' };
    }
    for (const key of UI_KEYS) {
      (doc['ui'] as Record<string, unknown>)[key] = { $type: 'color', $value: '#000000' };
    }
    for (const key of SURFACE_KEYS) {
      (doc['surface'] as Record<string, unknown>)[key] = { $type: 'color', $value: '#000000' };
    }

    // Should not throw — chain resolves through N hops to #abcdef
    const theme = fromDTCG(doc);
    expect(theme.status.success.hex).toBe('#abcdef');
  });

  it('edge-case hex values survive round-trip', () => {
    const edgeCases = ['#000000', '#ffffff', '#abcdef', '#123456', '#f0f0f0'];
    for (const hex of edgeCases) {
      const theme = buildTheme(
        'edge',
        () => ({ hex }),
        { brand: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }], accent: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }] },
      );
      const restored = fromDTCG(toDTCG(theme));
      expect(restored.status.success.hex).toBe(hex);
    }
  });
});
