import {
  _resetDefaultContextForTesting,
  afterEach,
  blockPreviewGuideId,
  colorHex,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  createCounterDemoModel,
  createTestContext,
  describe,
  expect,
  expectBoxTitleRowCloses,
  findCharBefore,
  findTextStart,
  it,
  PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES,
  renderBlocksGuide,
  renderBlocksGuideWithRealAnsi,
  rowContaining,
  standardBlockNamed,
  standardBlocks,
  stripAnsi,
  surfaceToString,
  textBefore,
} from './dogfood-block-preview-regressions.test-support.js';

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps the full docs-app preview regression sample bounded as the block catalog grows', () => {
    expect(PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES).toHaveLength(3);
    expect(PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES.length).toBeLessThan(standardBlocks.length);
    for (const blockName of PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES) {
      expect(standardBlockNamed(blockName).metadata.blockName).toBe(blockName);
    }
  });
});

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders selected standard block pages as visible preview surfaces before contract documentation', async () => {
    const expectedPreviewContent = new Map<string, readonly string[]>([
      ['AppShell', [
        'Navigation',
        'Content',
        'Inspector',
        'ReaderSurface live content from DOGFOOD Blocks.',
        'schema-bound; provider-ready; command-aware',
      ]],
      ['ReaderSurface', [
        'Navigation',
        'Content',
        'Outline',
        'ReaderSurface live content from DOGFOOD Blocks.',
      ]],
      ['InspectorPanel', [
        'Selection',
        'Details',
        'Actions',
        'ReaderSurface',
        'Reveal selection; Focus source',
      ]],
    ]);
    for (const blockName of PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES) {
      const block = standardBlockNamed(blockName);
      const { text } = await renderBlocksGuide(blockPreviewGuideId(block.metadata.blockName), 150, 43);
      const previewRegion = textBefore(text, 'documentation');
      expect(text).toContain(block.metadata.blockName);
      expect(previewRegion).toContain(block.metadata.blockName);
      expect(previewRegion).toContain('lowering summary');
      expect(previewRegion).toContain('interactive mode');
      expect(previewRegion).toContain('static mode');
      for (const expected of expectedPreviewContent.get(block.metadata.blockName) ?? []) {
        expect(previewRegion).toContain(expected);
      }
      expect(previewRegion).not.toContain('Story Matrix');
      expect(previewRegion).not.toContain('Package: block package:');
      expect(previewRegion).not.toContain('Contract: block metadata:');
      expect(previewRegion).not.toContain('Source: packages/bijou/src/core/standard-blocks.ts');
      expect(previewRegion).not.toContain('components=AppShellComposition');
    }
  });
});

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps lowering summary compact instead of rendering nested mini-surfaces inside the summary', async () => {
    const { text } = await renderBlocksGuide(blockPreviewGuideId('ReaderSurface'), 150, 43);
    const loweringRegion = text
      .slice(text.indexOf('lowering summary'))
      .split('documentation')[0] ?? '';
    expect(loweringRegion).toContain('interactive mode:');
    expect(loweringRegion).toContain('static mode:');
    expect(loweringRegion).toContain('pipe mode:');
    expect(loweringRegion).toContain('accessible mode:');
    expect(loweringRegion).toContain('facts');
    expect(loweringRegion).not.toContain('surface output:');
    expect(loweringRegion).not.toContain('┌─ ReaderSurface');
    expect(loweringRegion).not.toContain('┌─ Navigation');
  });
});

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps unselected Blocks navigation titles readable when marker styling uses real ANSI', async () => {
    const { ctx, frame } = await renderBlocksGuideWithRealAnsi(blockPreviewGuideId('ReaderSurface'), 150, 43);
    const title = findTextStart(frame, 'ReaderSurface');
    const marker = findCharBefore(frame, title.y, title.x, '•');
    const titleCell = frame.get(title.x, title.y);
    const markerCell = frame.get(marker.x, marker.y);
    expect(colorHex(markerCell.fg)).not.toBe(colorHex(titleCell.fg));
    expect(colorHex(titleCell.fg)).toBe(ctx.surface('primary').hex);
    expect(titleCell.modifiers ?? []).not.toContain('dim');
  });
});

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps the CounterDemoBlock fixture box bounded when style output contains ANSI codes', () => {
    const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 40 } });
    const styledCtx = {
      ...baseCtx,
      style: {
        ...baseCtx.style,
        styled: (_token: unknown, text: string) => `\x1b[31m${text}\x1b[0m`,
      },
    };
    const surface = counterDemoBlockSurface(counterDemoBlockConfig(createCounterDemoModel(5), styledCtx, 70));
    const lines = stripAnsi(surfaceToString(surface, styledCtx.style)).split('\n');
    expect(surface.width).toBe(70);
    expect(lines.every((line) => line.length <= surface.width)).toBe(true);
    expectBoxTitleRowCloses(rowContaining(lines, 'CounterDemoBlock fixture'));
    expect(rowContaining(lines, 'Counter: 5')).toContain('│');
    expect(rowContaining(lines, '[-] decrease')).toContain('[+] increase');
    expect(rowContaining(lines, 'Intents: - fixture.counter.decrement')).toContain(
      '+ fixture.counter.increment',
    );
  });
});
