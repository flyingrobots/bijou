import type { BijouContext, OutputMode } from '@flyingrobots/bijou';
import { createBrowsableListState, listFocusNext, listFocusPrev, listPageDown, listPageUp, type BrowsableListItem, type BrowsableListState, type FramePageMsg, type KeyMsg, type ResizeMsg } from '../../packages/bijou-tui/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { COMPONENT_STORIES } from './stories.js';

const REQUIRED_MODES: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];

const DEFAULT_TITLE = 'Bijou BlockLab';

const FOOTER_HINT = 'q quit | up/down story | d/u page | [/] story | ,/. variant | 1-4 profile';

const NEXT = 'Next story';

export interface StorybookAppOptions {
  readonly initialStoryId?: string;
  readonly stories?: readonly ComponentStory[];
  readonly title?: string;
}

export interface StorybookModel {
  readonly title: string;
  readonly columns: number;
  readonly rows: number;
  readonly storyState: BrowsableListState;
  readonly variantIndexByStory: Readonly<Record<string, number>>;
  readonly profileIndexByStory: Readonly<Record<string, number>>;
  readonly previewTimeMs: number;
}

export interface StorybookPageMsg {
  readonly type: 'storybook-key';
  readonly key: string;
}

type StorybookRuntimeMsg = FramePageMsg<StorybookPageMsg> | KeyMsg | ResizeMsg;

function adjustScroll(
  focusIndex: number,
  scrollY: number,
  height: number,
  totalItems: number,
): number {
  let nextScrollY = scrollY;
  if (focusIndex < nextScrollY) {
    nextScrollY = focusIndex;
  } else if (focusIndex >= nextScrollY + height) {
    nextScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(nextScrollY, maxScroll);
}

function setStoryFocus(
  state: BrowsableListState,
  focusIndex: number,
): BrowsableListState {
  const nextFocusIndex = Math.max(0, Math.min(focusIndex, state.items.length - 1));
  return {
    ...state,
    focusIndex: nextFocusIndex,
    scrollY: adjustScroll(nextFocusIndex, state.scrollY, state.height, state.items.length),
  };
}

function storyListHeight(rows: number): number {
  return Math.max(3, Math.floor(rows) - 8);
}

function storyListItems(stories: readonly ComponentStory[]): readonly BrowsableListItem[] {
  return stories.map((story) => ({
    label: story.title,
    value: story.id,
    description: story.family,
  }));
}

export function createInitialStorybookModel(
  ctx: BijouContext,
  stories: readonly ComponentStory[] = COMPONENT_STORIES,
  title = DEFAULT_TITLE,
  initialStoryId?: string,
): StorybookModel {
  if (stories.length === 0) {
    throw new Error('createStorybookApp requires at least one story');
  }

  const items = storyListItems(stories);
  const initialIndex = Math.max(0, stories.findIndex((story) => story.id === initialStoryId));
  const storyState = setStoryFocus(createBrowsableListState({
    items,
    height: storyListHeight(ctx.runtime.rows),
  }), initialIndex);

  return {
    title,
    columns: Math.max(1, ctx.runtime.columns),
    rows: Math.max(1, ctx.runtime.rows),
    storyState,
    variantIndexByStory: Object.fromEntries(stories.map((story) => [story.id, 0])),
    profileIndexByStory: Object.fromEntries(stories.map((story) => [story.id, 0])),
    previewTimeMs: 0,
  };
}

function syncStoryListHeight(
  state: BrowsableListState,
  height: number,
): BrowsableListState {
  const nextHeight = Math.max(1, Math.floor(height));
  return {
    ...state,
    height: nextHeight,
    scrollY: adjustScroll(state.focusIndex, state.scrollY, nextHeight, state.items.length),
  };
}

function focusStory(model: StorybookModel, delta: number): StorybookModel {
  const storyState = delta > 0
    ? listFocusNext(model.storyState)
    : listFocusPrev(model.storyState);
  return {
    ...model,
    storyState,
    previewTimeMs: 0,
  };
}

function pageStory(model: StorybookModel, delta: number): StorybookModel {
  const storyState = delta > 0
    ? listPageDown(model.storyState)
    : listPageUp(model.storyState);
  return {
    ...model,
    storyState,
    previewTimeMs: 0,
  };
}

function noStory(): never { throw new Error('empty'); }

export type { StorybookRuntimeMsg };
export { DEFAULT_TITLE, FOOTER_HINT, NEXT, REQUIRED_MODES, focusStory, noStory, pageStory, storyListHeight, syncStoryListHeight };
