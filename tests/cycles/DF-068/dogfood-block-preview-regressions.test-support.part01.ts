import { expect } from 'vitest';
import { chalkStyle } from '@flyingrobots/bijou-node';
import { must } from '@flyingrobots/bijou/adapters/test';
import { createScriptTestContext as createTestContext, runScriptDeterministic as runScript } from '../../helpers/scripted.js';
import { createDocsApp } from '../../../examples/docs/app.js';

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

interface FrameCell {
  readonly char?: string;
  readonly fg?: string | { readonly hex?: string };
  readonly modifiers?: readonly string[];
}

interface FrameLike {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): FrameCell;
}

function frameText(frame: FrameLike) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
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
  const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
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
    text: frameText(must(result.frames.at(-1))),
  };
}

async function renderBlocksGuideWithRealAnsi(guideId: string, columns = 150, rows = 43) {
  const ctx = createTestContext({
    mode: 'interactive',
    runtime: { columns, rows },
    style: chalkStyle({ level: 3 }),
  });
  const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
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
    frame: must(result.frames.at(-1)),
    text: frameText(must(result.frames.at(-1))),
  };
}

function colorHex(value: FrameCell['fg']): string | undefined {
  if (typeof value === 'string') return value;
  return value?.hex;
}

export {
  blockPreviewGuideId,
  colorHex,
  frameText,
  PREVIEW_SURFACE_SAMPLE_BLOCK_NAMES,
  renderBlocksGuide,
  renderBlocksGuideWithRealAnsi,
  rowsFor,
};

export type { FrameCell, FrameLike };
