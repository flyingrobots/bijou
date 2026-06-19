import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { fromDTCG, toDTCG, type DTCGDocument } from './dtcg.js';
import type { Theme, TextModifier, GradientStop, TokenValue, BaseStatusKey, BaseUiKey } from './tokens.js';

const ALL_MODIFIERS: TextModifier[] = ['bold', 'dim', 'strikethrough', 'inverse', 'underline', 'curly-underline', 'dotted-underline', 'dashed-underline'];
const STATUS_KEYS: BaseStatusKey[] = ['success', 'error', 'warning', 'info', 'pending', 'active', 'muted'];
const UI_KEYS: BaseUiKey[] = [
  'cursor',
  'focusGutter',
  'scrollThumb',
  'scrollTrack',
  'sectionHeader',
  'logo',
  'tableHeader',
  'trackEmpty',
];
const SEMANTIC_KEYS = ['success', 'error', 'warning', 'info', 'accent', 'muted', 'primary'] as const;
const BORDER_KEYS = ['primary', 'secondary', 'success', 'warning', 'error', 'muted'] as const;
const SURFACE_KEYS = ['primary', 'secondary', 'elevated', 'overlay', 'muted'] as const;

const hexColorArb = fc.integer({ min: 0, max: 0xffffff })
  .map((n) => '#' + n.toString(16).padStart(6, '0'));

const modifiersArb = fc.subarray(ALL_MODIFIERS, { minLength: 0, maxLength: 3 });

const tokenArb: fc.Arbitrary<TokenValue> = fc.record({
  hex: hexColorArb,
  modifiers: fc.option(modifiersArb, { nil: undefined }),
  bg: fc.option(hexColorArb, { nil: undefined }),
});

const gradientArb: fc.Arbitrary<GradientStop[]> = fc.array(
  fc.record({
    pos: fc.float({ min: 0, max: 1, noNaN: true }),
    color: fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    ),
  }),
  { minLength: 1, maxLength: 5 },
);

const TEST_GRADIENTS: Record<string, GradientStop[]> = { brand: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }], accent: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }] };

function buildTheme(
  name: string,
  tokenFn: () => TokenValue,
  gradients: Record<string, GradientStop[]>,
): Theme {
  return {
    name,
    status: { success: tokenFn(), error: tokenFn(), warning: tokenFn(), info: tokenFn(), pending: tokenFn(), active: tokenFn(), muted: tokenFn() },
    semantic: { success: tokenFn(), error: tokenFn(), warning: tokenFn(), info: tokenFn(), accent: tokenFn(), muted: tokenFn(), primary: tokenFn() },
    gradient: gradients,
    border: { primary: tokenFn(), secondary: tokenFn(), success: tokenFn(), warning: tokenFn(), error: tokenFn(), muted: tokenFn() },
    ui: { cursor: tokenFn(), focusGutter: tokenFn(), scrollThumb: tokenFn(), scrollTrack: tokenFn(), sectionHeader: tokenFn(), logo: tokenFn(), tableHeader: tokenFn(), trackEmpty: tokenFn() },
    surface: { primary: tokenFn(), secondary: tokenFn(), elevated: tokenFn(), overlay: tokenFn(), muted: tokenFn() },
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
          TEST_GRADIENTS,
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
          TEST_GRADIENTS,
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
    const depth = 7;
    const statusGroup: Record<string, unknown> = {};
    const semanticGroup: Record<string, unknown> = {};
    const borderGroup: Record<string, unknown> = {};
    const uiGroup: Record<string, unknown> = {};
    const surfaceGroup: Record<string, unknown> = {};
    const doc: DTCGDocument = {
      name: { $type: 'string', $value: 'chain-test' },
      status: statusGroup,
      semantic: semanticGroup,
      gradient: { brand: { $type: 'gradient', $value: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }] } },
      border: borderGroup,
      ui: uiGroup,
      surface: surfaceGroup,
    };

    for (let i = 0; i < depth - 1; i++) {
      statusGroup[`chain_${String(i)}`] = { $type: 'color', $value: `{status.chain_${String(i + 1)}}` };
    }
    statusGroup[`chain_${String(depth - 1)}`] = { $type: 'color', $value: '#abcdef' };

    for (const key of STATUS_KEYS) {
      if (!(key in statusGroup)) {
        statusGroup[key] = { $type: 'color', $value: '{status.chain_0}' };
      }
    }

    for (const key of SEMANTIC_KEYS) {
      semanticGroup[key] = { $type: 'color', $value: '#000000' };
    }
    for (const key of BORDER_KEYS) {
      borderGroup[key] = { $type: 'color', $value: '#000000' };
    }
    for (const key of UI_KEYS) {
      uiGroup[key] = { $type: 'color', $value: '#000000' };
    }
    for (const key of SURFACE_KEYS) {
      surfaceGroup[key] = { $type: 'color', $value: '#000000' };
    }

    const theme = fromDTCG(doc);
    expect(theme.status.success.hex).toBe('#abcdef');
  });

  it('edge-case hex values survive round-trip', () => {
    const edgeCases = ['#000000', '#ffffff', '#abcdef', '#123456', '#f0f0f0'];
    for (const hex of edgeCases) {
      const theme = buildTheme(
        'edge',
        () => ({ hex }),
        TEST_GRADIENTS,
      );
      const restored = fromDTCG(toDTCG(theme));
      expect(restored.status.success.hex).toBe(hex);
    }
  });
});
