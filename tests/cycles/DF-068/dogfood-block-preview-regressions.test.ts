import { afterEach, describe, expect, it } from 'vitest';
import {
  standardBlocks,
  stripAnsi,
  surfaceToString,
} from '@flyingrobots/bijou';
import { chalkStyle } from '@flyingrobots/bijou-node';
import {
  _resetDefaultContextForTesting,
} from '@flyingrobots/bijou/adapters/test';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  createCounterDemoModel,
} from '../../../examples/docs/counter-block-demo.js';

const PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES = [
  'AppShell',
  'ReaderSurface',
  'InspectorPanel',
] as const;

function blockPreviewGuideId(blockName: string): string {
  const slug = blockName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `blocks-preview-${slug || 'family'}`;
}

type FrameCell = {
  readonly char?: string;
  readonly fg?: string | { readonly hex?: string };
  readonly modifiers?: readonly string[];
};

type FrameLike = {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): FrameCell;
};

function frameText(frame: FrameLike) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

function rowsFor(text: string): readonly string[] {
  return text.split('\n');
}

async function renderBlocksGuide(guideId: string, columns = 150, rows = 43) {
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns, rows } });
  const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
  const result = await runScript(app, [{
    msg: {
      type: 'docs',
      msg: { type: 'select-guide', guideId },
    },
  }], { ctx });
  expect(result.frames.length).toBeGreaterThan(0);

  return {
    ctx,
    result,
    text: frameText(result.frames.at(-1)!),
  };
}

async function renderBlocksGuideWithRealAnsi(guideId: string, columns = 150, rows = 43) {
  const ctx = createTestContext({
    mode: 'interactive',
    runtime: { columns, rows },
    style: chalkStyle({ level: 3 }),
  });
  const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
  const result = await runScript(app, [{
    msg: {
      type: 'docs',
      msg: { type: 'select-guide', guideId },
    },
  }], { ctx });
  expect(result.frames.length).toBeGreaterThan(0);

  return {
    ctx,
    result,
    frame: result.frames.at(-1)!,
    text: frameText(result.frames.at(-1)!),
  };
}

function colorHex(value: FrameCell['fg']): string | undefined {
  if (typeof value === 'string') return value;
  return value?.hex;
}

function findTextStart(frame: FrameLike, text: string): { readonly x: number; readonly y: number } {
  for (let y = 0; y < frame.height; y++) {
    let row = '';
    for (let x = 0; x < frame.width; x++) {
      row += frame.get(x, y).char || ' ';
    }
    const x = row.indexOf(text);
    if (x >= 0) return { x, y };
  }
  throw new Error(`text not found in frame: ${text}`);
}

function findCharBefore(
  frame: FrameLike,
  y: number,
  beforeX: number,
  char: string,
): { readonly x: number; readonly y: number } {
  for (let x = beforeX - 1; x >= 0; x--) {
    if (frame.get(x, y).char === char) return { x, y };
  }
  throw new Error(`character ${char} not found before column ${beforeX}`);
}

function textBefore(text: string, marker: string): string {
  const index = text.indexOf(marker);
  return index === -1 ? text : text.slice(0, index);
}

function rowContaining(rows: readonly string[], needle: string): string {
  const row = rows.find((candidate) => candidate.includes(needle));
  expect(row).toBeDefined();
  return row!;
}

function expectBoxTitleRowCloses(row: string): void {
  const leftCorner = row.indexOf('┌');
  const rightCorner = row.lastIndexOf('┐');

  expect(leftCorner).toBeGreaterThanOrEqual(0);
  expect(rightCorner).toBeGreaterThan(leftCorner);
}

function standardBlockNamed(blockName: string) {
  const block = standardBlocks.find((candidate) => candidate.metadata.blockName === blockName);
  expect(block).toBeDefined();
  return block!;
}

describe('DF-068 DOGFOOD block preview regressions', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('keeps the full docs-app preview regression sample bounded as the block catalog grows', () => {
    expect(PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES).toHaveLength(3);
    expect(PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES.length).toBeLessThan(standardBlocks.length);

    for (const blockName of PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES) {
      expect(standardBlockNamed(blockName).metadata.blockName).toBe(blockName);
    }
  });

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

      expect(text).toContain(`${block.metadata.blockName}`);
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

  it('renders the CounterDemoBlock preview page without wrapped border rows and keeps intent keys live', async () => {
    const guideId = blockPreviewGuideId('CounterDemoBlock');
    const selected = await renderBlocksGuide(guideId, 150, 43);
    const incremented = await runScript(
      createDocsApp(selected.ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any }),
      [
        {
          msg: {
            type: 'docs',
            msg: { type: 'select-guide', guideId },
          },
        },
        { key: '+' },
      ],
      { ctx: selected.ctx },
    );
    const selectedRows = rowsFor(selected.text);

    expectBoxTitleRowCloses(rowContaining(selectedRows, 'CounterDemoBlock fixture'));
    expectBoxTitleRowCloses(rowContaining(selectedRows, 'lowering summary'));
    expectBoxTitleRowCloses(rowContaining(selectedRows, 'documentation'));
    expect(selected.text).toContain('Counter: 5');
    expect(selected.text).toContain('json: {"counter":5}');
    expect(frameText(incremented.frames.at(-1)!)).toContain('Counter: 6');
    expect(frameText(incremented.frames.at(-1)!)).toContain('json: {"counter":6}');
  });

  it('keeps the shell-owned perf HUD toggle available from block preview pages', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const toggled = await runScript(app, [
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId('AppShell') },
        },
      },
      { key: '`' },
    ], { ctx });
    const model = toggled.model as {
      docsModel: { perfHudOpen: boolean };
    };

    expect(model.docsModel.perfHudOpen).toBe(true);
    expect(frameText(toggled.frames.at(-1)!)).toContain('Perf HUD');
  });
});
