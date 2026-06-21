import { afterEach, describe, expect, it } from 'vitest';
import { standardBlocks, standardBlockStories } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { counterDemoBlockSurface } from '../../../examples/docs/counter-block-demo.js';
type DocsRootModel = ReturnType<ReturnType<typeof createDocsApp>['init']>[0];
const KEY_ENTER = '\r';
const KEY_NEXT_TAB = ']';
const KEY_TAB = '\t';
const KEY_BOTTOM = 'G';
function blockPreviewGuideId(blockName: string): string {
  const slug = blockName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `blocks-preview-${slug.length > 0 ? slug : 'block'}`;
}
function pageModel(model: DocsRootModel, pageId: string) { return must(model.docsModel.pageModels[pageId]); }
function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}
function frameRows(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  return frameText(frame).split('\n');
}
function foregroundStyledTextCellExists(
  frame: {
    width: number;
    height: number;
    get(x: number, y: number): {
      char?: string;
      fg?: unknown;
      fgRGB?: unknown;
      modifiers?: readonly string[];
    };
  },
  needle: string,
) {
  for (let y = 0; y < frame.height; y++) {
    let row = '';
    for (let x = 0; x < frame.width; x++) {
      row += frame.get(x, y).char ?? ' ';
    }
    for (
      let start = row.indexOf(needle);
      start !== -1;
      start = row.indexOf(needle, start + 1)
    ) {
      for (let x = start; x < Math.min(frame.width, start + needle.length); x++) {
        const cell = frame.get(x, y);
        if (
          cell.fg != null
          || cell.fgRGB != null
          || (cell.modifiers?.length ?? 0) > 0
        ) {
          return true;
        }
      }
    }
  }
  return false;
}
const STANDARD_BLOCK_PREVIEW_RENDER_CASE_NAMES = [
  'AppShell',
  'ReaderSurface',
  'TemporalDependencyBlock',
] as const;
function standardBlockPreviewRenderCases() {
  return STANDARD_BLOCK_PREVIEW_RENDER_CASE_NAMES.map((blockName) => {
    const block = standardBlocks.find((candidate) => candidate.metadata.blockName === blockName);
    return must(block);
  });
}
export {
  _resetDefaultContextForTesting,
  afterEach,
  blockPreviewGuideId,
  counterDemoBlockSurface,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  foregroundStyledTextCellExists,
  frameRows,
  frameText,
  it,
  KEY_BOTTOM,
  KEY_ENTER,
  KEY_NEXT_TAB,
  KEY_TAB,
  must,
  pageModel,
  runScript,
  STANDARD_BLOCK_PREVIEW_RENDER_CASE_NAMES,
  standardBlockPreviewRenderCases,
  standardBlocks,
  standardBlockStories,
};
export type { DocsRootModel };
