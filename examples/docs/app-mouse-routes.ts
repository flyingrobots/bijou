import type { MouseMsg } from '../../packages/bijou-tui/src/index.js';
import { DOCS_FAMILY_SEPARATOR_ROWS } from './app-ids.js';
import { adjustScroll } from './app-list-state.js';
import type {
  DocsExplorerModel,
  ExplorerMsg,
} from './app-model.js';
import {
  selectedStory,
  selectedVariantIndex,
} from './app-story-catalog.js';

interface PaneRect {
  readonly row: number;
  readonly height: number;
}

function listRowAtPosition(
  row: number,
  rect: PaneRect,
  scrollY: number,
  itemCount: number,
): number | undefined {
  const visibleHeight = Math.max(
    1,
    rect.height - DOCS_FAMILY_SEPARATOR_ROWS,
  );
  const bodyRow = row - rect.row - 1;
  if (bodyRow < 0 || bodyRow >= visibleHeight) return undefined;
  const index = scrollY + bodyRow;
  return index >= 0 && index < itemCount ? index : undefined;
}

export function resolveFamilyPaneMouse(
  message: MouseMsg,
  model: DocsExplorerModel,
  rect: PaneRect,
): ExplorerMsg | undefined {
  if (message.action === 'scroll-down') return { type: 'family-next' };
  if (message.action === 'scroll-up') return { type: 'family-prev' };
  if (message.action !== 'press' || message.button !== 'left') {
    return undefined;
  }
  const index = listRowAtPosition(
    message.row,
    rect,
    model.familyState.scrollY,
    model.familyState.items.length,
  );
  return index == null ? undefined : { type: 'activate-row-index', index };
}

export function resolveGuidePaneMouse(
  message: MouseMsg,
  model: DocsExplorerModel,
  rect: PaneRect,
): ExplorerMsg | undefined {
  if (message.action === 'scroll-down') return { type: 'guide-next' };
  if (message.action === 'scroll-up') return { type: 'guide-prev' };
  if (message.action !== 'press' || message.button !== 'left') {
    return undefined;
  }
  const index = listRowAtPosition(
    message.row,
    rect,
    model.guideState.scrollY,
    model.guideState.items.length,
  );
  return index == null ? undefined : { type: 'activate-guide-index', index };
}

export function resolveVariantPaneMouse(
  message: MouseMsg,
  model: DocsExplorerModel,
  rect: PaneRect,
): ExplorerMsg | undefined {
  if (message.action === 'scroll-down') return { type: 'variant-next' };
  if (message.action === 'scroll-up') return { type: 'variant-prev' };
  if (message.action !== 'press' || message.button !== 'left') {
    return undefined;
  }
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return undefined;
  const listHeight = Math.max(3, rect.height - 8);
  const listRow = message.row - rect.row - 1;
  if (listRow < 0 || listRow >= listHeight) return undefined;
  const current = selectedVariantIndex(model, story.id);
  const scrollY = adjustScroll(
    current,
    0,
    listHeight,
    story.variants.length,
  );
  const index = scrollY + listRow;
  return index >= 0 && index < story.variants.length
    ? { type: 'select-variant', index }
    : undefined;
}
