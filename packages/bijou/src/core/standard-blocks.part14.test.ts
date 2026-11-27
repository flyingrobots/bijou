import { appShellBlock, describe, expect, inspectorPanelBlock, it, readerSurfaceBlock } from './standard-blocks.test-support.js';
import { framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import { COMPOSITE_CASES, INSPECTOR_SLOTS, READER_SLOTS, SHELL_SLOTS, drawComposite, framedRegionTitles, framedRow, seededNext } from './standard-blocks-composite.test-support.js';

const RULE = framedRow('─'.repeat(56), 56);

describe.each(COMPOSITE_CASES)('$block.metadata.blockName interactive regions (flyingrobots/bijou#941)', (spec) => {
  const config = (width: number) => ({ width, sectionHeight: spec.sectionHeight });

  it('shows no framed box titled with one of its slot labels', () => {
    const frame = drawComposite(spec.block, spec.dogfood, config(60));
    expect(framedRegionTitles(frame)).toEqual([]);
    expect(framedSlotTitles(spec.block, frame)).toEqual([]);
  });

  it.each([30, 60, 120])('makes every row exactly %i columns wide', (width) => {
    const frame = drawComposite(spec.block, spec.dogfood, config(width));
    expect(frame.width).toBe(width);
    expect(frame.rows.every((row) => row.length === width)).toBe(true);
  });

  it('draws only the required region in one framed row when every optional slot is absent', () => {
    const frame = drawComposite(spec.block, spec.required, config(60));
    const [only] = Object.values(spec.required);
    expect(frame.rows).toHaveLength(3);
    expect(frame.rows[1]).toBe(framedRow(String(only), 56));
  });

  it('shows the missing-slot text inside the drawing when the required slot is absent', () => {
    const frame = drawComposite(spec.block, {}, config(60));
    expect(frame.rows[1]).toBe(framedRow(spec.missingText, 56));
    expect(framedRegionTitles(frame)).toEqual([]);
  });

  it('draws the same frame in static mode as in interactive mode', () => {
    expect(drawComposite(spec.block, spec.dogfood, config(60), 'static').rows)
      .toEqual(drawComposite(spec.block, spec.dogfood, config(60)).rows);
  });

  it('fits every width from 30 to 120 for seeded random slot values', () => {
    const next = seededNext(941);
    let witnesses = 0;
    for (let width = 30; width <= 120; width += 1) {
      const frame = drawComposite(spec.block, spec.fuzz(next), { width, sectionHeight: 1 + (next() % 10) });
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => row.length === width)).toBe(true);
      witnesses += 1;
    }
    expect(witnesses).toBe(91);
  });

  it('keeps the same facts in interactive mode as in pipe mode, apart from the mode fact', () => {
    const withoutMode = (facts: readonly { key: string }[] | undefined) =>
      (facts ?? []).filter((fact) => !fact.key.includes('mode'));
    const slots = { ...spec.required, extra: 'ignored' };
    expect(withoutMode(spec.block.render({ mode: 'interactive', slots }).facts))
      .toEqual(withoutMode(spec.block.render({ mode: 'pipe', slots }).facts));
  });
});

describe('AppShell interactive regions (flyingrobots/bijou#941)', () => {
  it('draws the DOGFOOD shell: navigation, content and inspector columns, then a rule and the status row', () => {
    const frame = drawComposite(appShellBlock, SHELL_SLOTS, { width: 60, sectionHeight: 8 });

    expect(frame.rows[0]).toMatch(/^┌─ AppShell ─+┐$/u);
    expect(frame.rows[1]).toMatch(/^│ Guides \/ +│ ┌─ ReaderSurface.* │ ┌─ InspectorPan.* │$/u);
    expect(frame.rows[2]).toMatch(/^│ Components \/ +│ │ ReaderSurface .* │ │ ReaderSurface .* │$/u);
    const rule = frame.rows.indexOf(RULE);
    expect(rule).toBeGreaterThan(2);
    expect(frame.rows[rule + 1]).toBe(framedRow('ready', 56));
    expect(frame.rows.at(-1)).toMatch(/^└─+┘$/u);
  });

  it('places navigation and content on the same rows at width 78', () => {
    const frame = drawComposite(appShellBlock, { navigation: 'Docs nav', content: 'Blocks guide' }, { width: 78 });

    expect(frame.rows[1]).toMatch(/^│ Docs nav +│ Blocks guide +│$/u);
  });

  it('lists the overlays above the status row', () => {
    const frame = drawComposite(appShellBlock, {
      content: 'Blocks guide',
      overlays: ['Command palette', 'Help drawer'],
      status: 'Ready',
    }, { width: 60 });

    expect(frame.rows.slice(1, -1)).toEqual([
      framedRow('Blocks guide', 56),
      RULE,
      framedRow('▸ Command palette', 56),
      framedRow('▸ Help drawer', 56),
      framedRow('Ready', 56),
    ]);
  });

  it('keeps pipe and accessible output and the region facts', () => {
    const slots = { navigation: 'Docs nav', content: 'Blocks guide', status: 'Ready' };
    const interactive = appShellBlock.render({ mode: 'interactive', slots });

    expect(appShellBlock.render({ mode: 'pipe', slots }).output)
      .toBe('AppShell\nnavigation: Docs nav\ncontent: Blocks guide\nstatus: Ready');
    expect(appShellBlock.render({ mode: 'accessible', slots }).output)
      .toBe('AppShell\nNavigation: Docs nav\nContent: Blocks guide\nStatus: Ready');
    expect(interactive.facts?.filter((fact) => fact.key.startsWith('region.')).map((fact) => fact.key)).toEqual([
      'region.navigation', 'region.navigation.value', 'region.content', 'region.content.value', 'region.status', 'region.status.value',
    ]);
  });
});

describe('ReaderSurface and InspectorPanel interactive regions (flyingrobots/bijou#941)', () => {
  it('draws the DOGFOOD reader: navigation and outline columns beside the content', () => {
    const frame = drawComposite(readerSurfaceBlock, READER_SLOTS, { width: 60, sectionHeight: 5 });
    const row = (nav: string, content: string, outline: string) =>
      `│ ${nav.padEnd(14)} │ ${content.padEnd(22)} │ ${outline.padEnd(14)} │`;

    expect(frame.rows[0]).toMatch(/^┌─ ReaderSurface ─+┐$/u);
    expect(frame.rows.slice(1, -1)).toEqual([
      row('Blocks', 'ReaderSurface live', 'What are'),
      row('navigation', 'content from DOGFOOD', 'Blocks'),
      row('', 'Blocks.', 'How Blocks'),
      row('', '', 'Lower'),
    ]);
  });

  it('draws the DOGFOOD inspector: selection heading, a rule, details and one cue row of actions', () => {
    const frame = drawComposite(inspectorPanelBlock, INSPECTOR_SLOTS, { width: 60, sectionHeight: 5 });

    expect(frame.rows[0]).toMatch(/^┌─ InspectorPanel ─+┐$/u);
    expect(frame.rows.slice(1, -1)).toEqual([
      framedRow('ReaderSurface', 56),
      RULE,
      framedRow('schema-bound', 56),
      framedRow('provider-ready', 56),
      framedRow('command-aware', 56),
      framedRow('▸ Reveal selection  ▸ Focus source', 56),
    ]);
  });

  it('keeps pipe and accessible output as labelled slot lines', () => {
    expect(readerSurfaceBlock.render({ mode: 'pipe', slots: READER_SLOTS }).output).toBe(
      'ReaderSurface\nnavigation: Blocks navigation\ncontent: ReaderSurface live content from DOGFOOD Blocks.\n'
      + 'outline: What are Blocks; How Blocks Lower',
    );
    expect(inspectorPanelBlock.render({ mode: 'accessible', slots: INSPECTOR_SLOTS }).output).toBe(
      'InspectorPanel\nSelection: ReaderSurface\nDetails: schema-bound; provider-ready; command-aware\n'
      + 'Actions: Reveal selection; Focus source',
    );
  });
});
