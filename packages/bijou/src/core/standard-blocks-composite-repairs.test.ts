import { createSurface, describe, expect, findCell, isSurfaceOutput, it } from './standard-blocks.test-support.js';
import { drawnFrame } from './standard-blocks-drawn.test-support.js';
import { COMPOSITE_CASES, drawComposite, framedRow } from './standard-blocks-composite.test-support.js';

/** The slot of each composite block that carries a list, and one that carries plain text. */
const SLOT_ROLES: ReadonlyMap<string, { readonly optional: string; readonly list: string }> = new Map([
  ['AppShell', { optional: 'inspector', list: 'overlays' }],
  ['ReaderSurface', { optional: 'navigation', list: 'outline' }],
  ['InspectorPanel', { optional: 'details', list: 'actions' }],
]);

function rolesOf(blockName: string): { readonly optional: string; readonly list: string } {
  const roles = SLOT_ROLES.get(blockName);
  if (roles === undefined) throw new Error(`no slot roles for ${blockName}`);
  return roles;
}

/** Every word of the frame, with border and rule glyphs taken out. */
function frameWords(rows: readonly string[]): ReadonlySet<string> {
  return new Set(rows.join(' ').replace(/[│┌┐└┘├┤─]/gu, ' ').split(/\s+/u).filter((word) => word !== ''));
}

/** The words of every text value in `slots`, list items included. */
function slotWords(slots: Readonly<Record<string, unknown>>): readonly string[] {
  return Object.values(slots)
    .flatMap((value): readonly string[] => {
      if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
      return typeof value === 'string' ? [value] : [];
    })
    .flatMap((value) => value.split(/\s+/u).filter((word) => word !== ''));
}

function styledSurface(char: string) {
  const surface = createSurface(3, 2);
  surface.set(1, 1, { char, fg: '#00ff00', bg: '#ff00ff', modifiers: ['bold'] });
  return surface;
}

describe.each(COMPOSITE_CASES)('$block.metadata.blockName region repairs (flyingrobots/bijou#941)', (spec) => {
  const blockName = spec.block.metadata.blockName;
  const [requiredId] = Object.keys(spec.required);

  it('places Surface slot values cell by cell, keeping their style, in the required and an optional region', () => {
    const { optional } = rolesOf(blockName);
    const result = spec.block.render({
      mode: 'interactive',
      slots: { [String(requiredId)]: styledSurface('◆'), [optional]: styledSurface('◇') },
      config: { width: 60 },
    });
    if (!isSurfaceOutput(result)) throw new Error('interactive output is not a Surface');

    for (const char of ['◆', '◇']) {
      expect(findCell(result.output, char)).toMatchObject({ fg: '#00ff00', bg: '#ff00ff', modifiers: ['bold'] });
    }
  });

  it('places a Surface holding a wide grapheme without throwing', () => {
    const frame = drawnFrame(spec.block.render({
      mode: 'interactive',
      slots: { [String(requiredId)]: styledSurface('界') },
      config: { width: 30 },
    }));

    expect(frame.width).toBe(30);
  });

  it('keeps every word of the DOGFOOD slot text at width 30', () => {
    const words = frameWords(drawComposite(spec.block, spec.dogfood, { width: 30 }).rows);

    expect(slotWords(spec.dogfood).filter((word) => !words.has(word))).toEqual([]);
  });

  it('wraps list items and missing-slot text instead of cutting them at the row edge', () => {
    const { list } = rolesOf(blockName);
    const items = ['an item long enough to wrap across the narrow region', 'second item'];
    const words = frameWords(drawComposite(spec.block, { [list]: items }, { width: 30 }).rows);

    expect([...slotWords({ items }), ...spec.missingText.split(' ')].filter((word) => !words.has(word))).toEqual([]);
  });

  it('reads slots without calling accessors, and shows the missing-slot text for a throwing required slot', () => {
    const { list } = rolesOf(blockName);
    const slots = {};
    for (const id of [String(requiredId), list]) {
      Object.defineProperty(slots, id, { enumerable: true, get: () => { throw new Error(`${id} accessor called`); } });
    }

    const frame = drawnFrame(spec.block.render({ mode: 'interactive', slots, config: { width: 60 } }));
    expect(frame.rows[1]).toBe(framedRow(spec.missingText, 56));
  });
});
