import { describe, expect, it } from './standard-blocks.test-support.js';
import { drawnFrame } from './standard-blocks-drawn.test-support.js';
import { COMPOSITE_CASES, framedRow } from './standard-blocks-composite.test-support.js';

/** The slot of each composite block whose items are drawn one per row. */
const ROW_LISTS: ReadonlyMap<string, string> = new Map([
  ['AppShell', 'overlays'],
  ['ReaderSurface', 'outline'],
  ['InspectorPanel', 'details'],
]);

function rowListOf(blockName: string): string {
  const list = ROW_LISTS.get(blockName);
  if (list === undefined) throw new Error(`no row list for ${blockName}`);
  return list;
}

/** A list whose own iterator throws: reading it must go by index, never through iteration. */
function iteratorTrap(items: readonly string[]): readonly string[] {
  const trapped = [...items];
  Object.defineProperty(trapped, Symbol.iterator, { value: () => { throw new Error('list iterated'); } });
  return trapped;
}

function rowIndex(rows: readonly string[], text: string): number {
  return rows.findIndex((row) => row.includes(text));
}

describe.each(COMPOSITE_CASES)('$block.metadata.blockName list slots (flyingrobots/bijou#941)', (spec) => {
  const blockName = spec.block.metadata.blockName;
  const draw = (slots: Readonly<Record<string, unknown>>, width = 60) =>
    drawnFrame(spec.block.render({ mode: 'interactive', slots: { ...spec.required, ...slots }, config: { width } }));

  it('reads a list slot by index, without calling its own iterator', () => {
    const list = rowListOf(blockName);
    const frame = draw({ [list]: iteratorTrap(['alpha', 'beta']) });

    expect(rowIndex(frame.rows, 'alpha')).toBeGreaterThan(0);
    expect(rowIndex(frame.rows, 'beta')).toBe(rowIndex(frame.rows, 'alpha') + 1);
  });

  it('leaves out blank list items instead of drawing empty rows', () => {
    const list = rowListOf(blockName);
    const rows = draw({ [list]: ['alpha', '', '   ', 'beta'] }).rows;

    expect(rowIndex(rows, 'beta')).toBe(rowIndex(rows, 'alpha') + 1);
  });
});

describe('InspectorPanel action cue row (flyingrobots/bijou#941)', () => {
  const inspector = COMPOSITE_CASES.find((spec) => spec.block.metadata.blockName === 'InspectorPanel');
  const draw = (actions: unknown, width: number) => {
    if (inspector === undefined) throw new Error('no InspectorPanel case');
    return drawnFrame(inspector.block.render({
      mode: 'interactive',
      slots: { selection: 'ReaderSurface', actions },
      config: { width },
    })).rows;
  };

  it('draws no bare cue for a blank action', () => {
    expect(draw(['Reveal selection', '', '  ', 'Focus source'], 60)).toContain(
      framedRow('▸ Reveal selection  ▸ Focus source', 56),
    );
  });

  it('keeps each cue mark with its action when the cue row wraps at width 30', () => {
    const rows = draw(['Reveal selection', 'Focus source'], 30);

    expect(rows.some((row) => /▸ *│$/u.test(row))).toBe(false);
    expect(rowIndex(rows, '▸ Reveal selection')).toBeGreaterThan(0);
    expect(rowIndex(rows, '▸ Focus source')).toBe(rowIndex(rows, '▸ Reveal selection') + 1);
  });

  it('reads the actions by index, without calling their own iterator', () => {
    expect(draw(iteratorTrap(['Reveal selection', 'Focus source']), 60)).toContain(
      framedRow('▸ Reveal selection  ▸ Focus source', 56),
    );
  });
});
