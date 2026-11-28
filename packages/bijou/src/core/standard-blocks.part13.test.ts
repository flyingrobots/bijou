import {
  denseComparisonBlock, describe, expect, explorationListBlock, hierarchyBlock, it,
  modeAwarePrimitiveBlock, temporalDependencyBlock,
} from './standard-blocks.test-support.js';
import { framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import { controlCharacters, dataSlots, drawBlock, lcg, lowerModeOutput, markedRows, randomSlots, withoutSlots } from './standard-blocks-data-drawn.test-support.js';

const DATA_BLOCKS = [denseComparisonBlock, hierarchyBlock, explorationListBlock, temporalDependencyBlock, modeAwarePrimitiveBlock];
const draw = (name: string, block: typeof hierarchyBlock, width = 60) => drawBlock(block, dataSlots(name), width);

describe('data blocks draw themselves in interactive mode (flyingrobots/bijou#940)', () => {
  it('draws DenseComparisonBlock as its title over a table with one header row and one data row', () => {
    const frame = draw('DenseComparisonBlock', denseComparisonBlock);
    const tableRows = frame.rows.filter((row) => row.startsWith('│'));

    expect(frame.rows[0]).toMatch(/^Compare packages +$/u);
    expect(frame.rows[1]).toMatch(/^┌─+┬─+┬─+┬─+┐/u);
    expect(tableRows).toHaveLength(2);
    expect(tableRows[0]).toMatch(/^│ Metric +│ Left +│ Right +│ Delta +│/u);
    expect(tableRows[1]).toMatch(/^│ ▸ tests +│ 1820 +│ 640 +│ \+12 +│/u);
  });

  it('draws HierarchyBlock as a tree from the root and marks only the selected node', () => {
    const frame = draw('HierarchyBlock', hierarchyBlock);

    expect(frame.rows.slice(0, 4)).toEqual([
      '  docs/'.padEnd(60), '▸ ├─ design/'.padEnd(60), '  ├─ DX-031.md'.padEnd(60), '  └─ METHOD.md'.padEnd(60),
    ]);
    expect(frame.rows[4]).toMatch(/^Parent: docs\/ · Depth: 1 · Expanded: true +$/u);
    expect(markedRows(frame)).toHaveLength(1);
  });

  it('marks the last node when it is the selected one', () => {
    const frame = drawBlock(hierarchyBlock, { ...dataSlots('HierarchyBlock'), selected: 'METHOD.md' });

    expect(markedRows(frame)).toEqual(['▸ └─ METHOD.md'.padEnd(60)]);
  });

  it('draws ExplorationListBlock as its title, facet badge, marked item list and preview', () => {
    const frame = draw('ExplorationListBlock', explorationListBlock);

    expect(frame.rows[0]).toMatch(/^Explore components +$/u);
    expect(frame.rows[1]).toMatch(/^ input +$/u);
    expect(frame.rows.slice(2, 4)).toEqual(['▸ TextEntry field input'.padEnd(60), '  SingleChoice radio/select'.padEnd(60)]);
    expect(frame.rows[4]).toBe('─'.repeat(60));
    expect(frame.rows[5]).toMatch(/^field input +$/u);
    expect(markedRows(frame)).toHaveLength(1);
  });

  it('draws TemporalDependencyBlock as a timeline with the selected event filled and the dependency below', () => {
    const frame = draw('TemporalDependencyBlock', temporalDependencyBlock);

    expect(frame.rows.map((row) => row.trimEnd())).toEqual([
      'Timeline', '○ 09:00 build', '│', '○ 09:05 test', '│', '● 09:10 publish',
      '↳ publish waits for test', 'Depends on: test',
    ]);
  });

  it('draws ModeAwarePrimitiveBlock as a marked badge with its fact and value, then its contract', () => {
    const frame = draw('ModeAwarePrimitiveBlock', modeAwarePrimitiveBlock);

    expect(frame.rows.map((row) => row.trimEnd())).toEqual([
      '▸  metric badge  latency-ms: 42', 'Status: good · Mode contract: visual and pipe',
    ]);
  });

  it.each(DATA_BLOCKS.flatMap((block) => [30, 120].map((width) => [block.metadata.blockName, width, block] as const)))(
    '%s shows no framed box titled with a slot label and fits width %i',
    (name, width, block) => {
      const frame = draw(name, block, width);

      expect(framedSlotTitles(block, frame)).toEqual([]);
      expect(frame.width).toBe(width);
      expect(frame.rows.filter((row) => row.length === width)).toHaveLength(frame.height);
    },
  );

  it.each(DATA_BLOCKS.map((block) => [block.metadata.blockName, block] as const))(
    '%s draws the same frame in static mode as in interactive mode',
    (name, block) => {
      expect(drawBlock(block, dataSlots(name), 60, 'static').rows).toEqual(draw(name, block).rows);
    },
  );

  it.each([
    ['DenseComparisonBlock', denseComparisonBlock, ['selected'], /▸/u],
    ['HierarchyBlock', hierarchyBlock, ['parent', 'depth', 'expanded'], /Parent|Depth|Expanded/u],
    ['ExplorationListBlock', explorationListBlock, ['preview'], /^─+$/u],
    ['TemporalDependencyBlock', temporalDependencyBlock, ['selected', 'dependsOn'], /●|Depends on/u],
    ['ModeAwarePrimitiveBlock', modeAwarePrimitiveBlock, ['status', 'modeContract', 'selected'], /▸|Status|Mode contract/u],
  ] as const)('%s leaves out its absent optional slots', (name, block, optional, absent) => {
    const frame = drawBlock(block, withoutSlots(dataSlots(name), optional));

    expect(frame.rows.filter((row) => absent.test(row))).toEqual([]);
    expect(frame.rows.every((row) => row.length === 60)).toBe(true);
  });

  it.each([
    ['DenseComparisonBlock', 'metric', denseComparisonBlock],
    ['HierarchyBlock', 'nodes', hierarchyBlock],
    ['HierarchyBlock', 'selected', hierarchyBlock],
    ['ExplorationListBlock', 'items', explorationListBlock],
    ['TemporalDependencyBlock', 'events', temporalDependencyBlock],
    ['ModeAwarePrimitiveBlock', 'value', modeAwarePrimitiveBlock],
  ] as const)('%s shows the missing-slot text for %s inside the drawing', (name, missing, block) => {
    const frame = drawBlock(block, withoutSlots(dataSlots(name), [missing]));

    expect(frame.rows.some((row) => row.includes(`(missing required ${missing})`))).toBe(true);
    expect(framedSlotTitles(block, frame)).toEqual([]);
  });

  it.each(DATA_BLOCKS.map((block, index) => [block.metadata.blockName, 9400 + index, block] as const))(
    '%s fits the requested width for seeded random slots (seed %i)',
    (name, seed, block) => {
      const next = lcg(seed);
      let witnesses = 0;
      for (let run = 0; run < 60; run += 1) {
        const width = 30 + (next() % 91);
        const frame = drawBlock(block, randomSlots(name, next), width);
        const fits = frame.width === width && frame.rows.every((row) => row.length === width);
        expect(fits, `seed ${String(seed)} run ${String(run)} width ${String(width)}`).toBe(true);
        expect(controlCharacters(frame.rows), `seed ${String(seed)} run ${String(run)}`).toEqual([]);
        witnesses += 1;
      }
      expect(witnesses).toBe(60);
    },
  );
});

describe('data blocks keep pipe, accessible and facts unchanged (flyingrobots/bijou#940)', () => {
  it.each(DATA_BLOCKS.flatMap((block) => (['pipe', 'accessible'] as const).map((mode) => [block.metadata.blockName, mode, block] as const)))(
    '%s keeps its %s output as slot lines',
    (name, mode, block) => {
      expect(block.render({ mode, slots: dataSlots(name) }).output).toBe(lowerModeOutput(name, mode));
    },
  );

  it.each(DATA_BLOCKS.map((block) => [block.metadata.blockName, block] as const))(
    '%s keeps the same facts in interactive mode as in pipe mode, apart from the mode fact',
    (name, block) => {
      const withoutMode = (facts: readonly { key: string }[] | undefined) => (facts ?? []).filter((fact) => !fact.key.includes('mode'));
      const slots = dataSlots(name);

      expect(withoutMode(block.render({ mode: 'interactive', slots }).facts)).toEqual(withoutMode(block.render({ mode: 'pipe', slots }).facts));
    },
  );
});
