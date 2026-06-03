import {
  boxSurface,
  createSurface,
  inspector,
  markdown,
  separatorSurface,
  type BijouContext,
  type OutputMode,
  type Surface,
} from '@flyingrobots/bijou';
import {
  browsableListSurface,
  createFramedApp,
  createBrowsableListState,
  createKeyMap,
  isKeyMsg,
  isMouseMsg,
  isResizeMsg,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  quit,
  viewportSurface,
  type App,
  type BrowsableListItem,
  type BrowsableListState,
  type Cmd,
  type FrameLayoutNode,
  type FramePage,
  type FramePageMsg,
  type FramedApp,
  type KeyMsg,
  type ResizeMsg,
} from '../../packages/bijou-tui/src/index.js';
import {
  createStoryProfileContext,
  resolveStoryProfilePreset,
  resolveStoryVariant,
  storyDocsMarkdown,
  storyPreviewSurface,
  type ComponentStory,
} from '../_stories/protocol.js';
import {
  column,
  contentSurface,
  line,
  proseSurface,
  spacer,
} from '../_shared/example-surfaces.js';
import { COMPONENT_STORIES } from './stories.js';

const REQUIRED_MODES: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];
const DEFAULT_TITLE = 'Bijou BlockLab';
const FOOTER_HINT = 'q quit | up/down story | d/u page | [/] story | ,/. variant | 1-4 profile';

export interface StorybookAppOptions {
  readonly initialStoryId?: string;
  readonly stories?: readonly ComponentStory[];
  readonly title?: string;
}

export interface StorybookModel {
  readonly title: string;
  readonly columns: number;
  readonly rows: number;
  readonly storyState: BrowsableListState<string>;
  readonly variantIndexByStory: Readonly<Record<string, number>>;
  readonly profileIndexByStory: Readonly<Record<string, number>>;
  readonly previewTimeMs: number;
}

export interface StorybookPageMsg {
  readonly type: 'storybook-key';
  readonly key: string;
}

type StorybookRuntimeMsg = FramePageMsg<StorybookPageMsg> | KeyMsg | ResizeMsg;

export function createStorybookApp(
  ctx: BijouContext,
  options: StorybookAppOptions = {},
): App<StorybookModel, StorybookPageMsg> {
  const stories = options.stories ?? COMPONENT_STORIES;
  const title = options.title ?? DEFAULT_TITLE;

  return {
    init() {
      return [createInitialStorybookModel(ctx, stories, title, options.initialStoryId), []];
    },

    update(msg, model) {
      return updateStorybookMessage(msg, model, stories);
    },

    view(model) {
      return renderStorybook(model, ctx, stories);
    },
  };
}

export function createStorybookFrameApp(
  ctx: BijouContext,
  options: StorybookAppOptions = {},
): FramedApp<StorybookModel, StorybookPageMsg> {
  const stories = options.stories ?? COMPONENT_STORIES;
  const title = options.title ?? DEFAULT_TITLE;

  return createFramedApp<StorybookModel, StorybookPageMsg>({
    ctx,
    title,
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    helpLineSource: () => FOOTER_HINT,
    pages: [createStorybookPage(ctx, stories, title, options.initialStoryId)],
  });
}

export const createBlockLabApp = createStorybookApp;
export const createBlockLabFrameApp = createStorybookFrameApp;

export function createStorybookPage(
  ctx: BijouContext,
  stories: readonly ComponentStory[] = COMPONENT_STORIES,
  title = DEFAULT_TITLE,
  initialStoryId?: string,
): FramePage<StorybookModel, StorybookPageMsg> {
  return {
    id: 'storybook',
    title: 'BlockLab',
    init: () => [createInitialStorybookModel(ctx, stories, title, initialStoryId), []],
    update(msg: FramePageMsg<StorybookPageMsg>, model) {
      return updateStorybookMessage(msg, model, stories);
    },
    keyMap: storybookPageKeys,
    layout: (model) => ({
      kind: 'pane',
      paneId: 'blocklab-workbench',
      overflowX: 'scroll',
      render: (width, height) => renderStorybookBody({
        ...model,
        columns: width,
        rows: height,
      }, ctx, stories),
    }) satisfies FrameLayoutNode,
  };
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

export function selectedStorybookStory(
  model: StorybookModel,
  stories: readonly ComponentStory[] = COMPONENT_STORIES,
): ComponentStory {
  const storyId = model.storyState.items[model.storyState.focusIndex]?.value;
  return stories.find((story) => story.id === storyId) ?? stories[0]!;
}

function updateStorybookMessage(
  msg: StorybookRuntimeMsg,
  model: StorybookModel,
  stories: readonly ComponentStory[],
): [StorybookModel, Cmd<StorybookPageMsg>[]] {
  if (isResizeMsg(msg)) {
    return [{
      ...model,
      columns: Math.max(1, msg.columns),
      rows: Math.max(1, msg.rows),
      storyState: syncStoryListHeight(model.storyState, storyListHeight(msg.rows)),
    }, []];
  }

  if (msg.type === 'pulse') {
    return [{
      ...model,
      previewTimeMs: model.previewTimeMs + Math.round(Math.max(0, msg.dt) * 1000),
    }, []];
  }

  if (isMouseMsg(msg)) {
    if (msg.action === 'scroll-down') return [focusStory(model, 1), []];
    if (msg.action === 'scroll-up') return [focusStory(model, -1), []];
    return [model, []];
  }

  if (msg.type === 'storybook-key') {
    return updateKey(msg.key, model, stories);
  }

  if (!isKeyMsg(msg)) {
    return [model, []];
  }

  return updateKey(msg.key, model, stories);
}

function updateKey(
  key: string,
  model: StorybookModel,
  stories: readonly ComponentStory[],
): [StorybookModel, Cmd<StorybookPageMsg>[]] {
  switch (key) {
    case 'q':
    case 'escape':
      return [model, [quit()]];
    case 'down':
    case 'j':
    case ']':
      return [focusStory(model, 1), []];
    case 'up':
    case 'k':
    case '[':
      return [focusStory(model, -1), []];
    case 'pagedown':
    case 'd':
      return [pageStory(model, 1), []];
    case 'pageup':
    case 'u':
      return [pageStory(model, -1), []];
    case '.':
      return [cycleVariant(model, stories, 1), []];
    case ',':
      return [cycleVariant(model, stories, -1), []];
    case '1':
    case '2':
    case '3':
    case '4':
      return [setProfileIndex(model, stories, Number(key) - 1), []];
    default:
      return [model, []];
  }
}

const storybookPageKeys = createKeyMap<StorybookPageMsg>()
  .group('BlockLab', (group) => group
    .bind('down', 'Next story', { type: 'storybook-key', key: 'down' })
    .bind('j', 'Next story', { type: 'storybook-key', key: 'j' })
    .bind(']', 'Next story', { type: 'storybook-key', key: ']' })
    .bind('up', 'Previous story', { type: 'storybook-key', key: 'up' })
    .bind('k', 'Previous story', { type: 'storybook-key', key: 'k' })
    .bind('[', 'Previous story', { type: 'storybook-key', key: '[' })
    .bind('pagedown', 'Page down', { type: 'storybook-key', key: 'pagedown' })
    .bind('d', 'Page down', { type: 'storybook-key', key: 'd' })
    .bind('pageup', 'Page up', { type: 'storybook-key', key: 'pageup' })
    .bind('u', 'Page up', { type: 'storybook-key', key: 'u' })
    .bind('.', 'Next variant', { type: 'storybook-key', key: '.' })
    .bind(',', 'Previous variant', { type: 'storybook-key', key: ',' })
    .bind('1', 'Profile 1', { type: 'storybook-key', key: '1' })
    .bind('2', 'Profile 2', { type: 'storybook-key', key: '2' })
    .bind('3', 'Profile 3', { type: 'storybook-key', key: '3' })
    .bind('4', 'Profile 4', { type: 'storybook-key', key: '4' }));

function renderStorybook(
  model: StorybookModel,
  ctx: BijouContext,
  stories: readonly ComponentStory[],
): Surface {
  const screen = createSurface(model.columns, model.rows);
  const story = selectedStorybookStory(model, stories);
  const variant = selectedVariant(model, story);
  const profile = selectedProfile(model, story);

  screen.blit(renderHeader(model, story, variant.label, profile.label), 0, 0);

  const bodyTop = 1;
  const bodyHeight = Math.max(1, model.rows - 2);
  screen.blit(renderStorybookBody({ ...model, rows: bodyHeight }, ctx, stories), 0, bodyTop);

  screen.blit(line(fit(FOOTER_HINT, model.columns), model.columns), 0, model.rows - 1);
  return screen;
}

function renderStorybookBody(
  model: StorybookModel,
  ctx: BijouContext,
  stories: readonly ComponentStory[],
): Surface {
  const screen = createSurface(model.columns, model.rows);
  const story = selectedStorybookStory(model, stories);

  if (model.columns >= 116 && model.rows >= 12) {
    const catalogWidth = 34;
    const testingWidth = 36;
    const previewWidth = Math.max(20, model.columns - catalogWidth - testingWidth);
    screen.blit(renderCatalogPane(model, catalogWidth, model.rows, ctx), 0, 0);
    screen.blit(renderPreviewPane(model, story, previewWidth, model.rows, ctx), catalogWidth, 0);
    screen.blit(renderTestingPane(model, story, testingWidth, model.rows, ctx), catalogWidth + previewWidth, 0);
  } else if (model.columns >= 76 && model.rows >= 10) {
    const catalogWidth = 30;
    const previewWidth = Math.max(20, model.columns - catalogWidth);
    screen.blit(renderCatalogPane(model, catalogWidth, model.rows, ctx), 0, 0);
    screen.blit(renderPreviewPane(model, story, previewWidth, model.rows, ctx), catalogWidth, 0);
  } else {
    screen.blit(renderPreviewPane(model, story, model.columns, model.rows, ctx), 0, 0);
  }

  return screen;
}

function renderHeader(
  model: StorybookModel,
  story: ComponentStory,
  variantLabel: string,
  profileLabel: string,
): Surface {
  const text = `${model.title} | ${story.id} | ${variantLabel} | ${profileLabel}`;
  return line(fit(text, model.columns), model.columns);
}

function renderCatalogPane(
  model: StorybookModel,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const listHeight = Math.max(1, height - 6);
  const listState = syncStoryListHeight(model.storyState, listHeight);
  const bodyWidth = Math.max(1, width - 4);
  const list = browsableListSurface(listState, {
    width: bodyWidth,
    showScrollbar: true,
    focusIndicator: '>',
    focusedRowOverflow: { mode: 'marquee', elapsedMs: model.previewTimeMs },
    ctx,
  });

  const content = column([
    separatorSurface({ label: `${model.storyState.items.length} stories`, width: bodyWidth, ctx }),
    spacer(),
    list,
  ]);

  return paneSurface('catalog', content, width, height, ctx);
}

function renderPreviewPane(
  model: StorybookModel,
  story: ComponentStory,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const bodyWidth = Math.max(20, width - 4);
  const variant = selectedVariant(model, story);
  const profile = selectedProfile(model, story);
  const previewWidth = Math.max(20, Math.min(profile.width, bodyWidth - 4));
  const previewHeight = Math.max(6, Math.min(18, height - 12));
  const previewCtx = createStoryProfileContext(ctx, profile, {
    width: previewWidth,
    height: previewHeight,
  });
  const preview = storyPreviewSurface(variant.render({
    width: previewWidth,
    ctx: previewCtx,
    state: variant.initialState as never,
    timeMs: model.previewTimeMs,
  }));
  const previewTitle = `${profile.label} / ${variant.label}`;
  const previewCard = boxSurface(preview, {
    title: previewTitle,
    width: Math.max(24, Math.min(bodyWidth, Math.max(preview.width + 4, previewTitle.length + 4))),
    padding: { left: 1, right: 1 },
    ctx,
  });
  const docsWidth = Math.max(20, bodyWidth - 2);
  const docs = proseSurface(markdown(storyDocsMarkdown(story, variant, profile), {
    width: docsWidth,
    ctx,
  }), docsWidth);

  return paneSurface('preview', column([
    line(fit(story.title, bodyWidth), bodyWidth),
    spacer(),
    previewCard,
    spacer(),
    docs,
  ]), width, height, ctx);
}

function renderTestingPane(
  model: StorybookModel,
  story: ComponentStory,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const bodyWidth = Math.max(20, width - 4);
  const profileModes = new Set(story.profilePresets.map((profile) => profile.mode));
  const missingModes = REQUIRED_MODES.filter((mode) => !profileModes.has(mode));
  const variant = selectedVariant(model, story);
  const profile = selectedProfile(model, story);
  const modeStatus = REQUIRED_MODES
    .map((mode) => `${mode}: ${profileModes.has(mode) ? 'ready' : 'missing'}`)
    .join('\n');
  const source = story.source?.examplePath ?? 'No source path registered.';

  const content = contentSurface(inspector({
    title: 'test matrix',
    currentValue: missingModes.length === 0 ? 'all required modes' : `missing ${missingModes.join(', ')}`,
    sections: [
      {
        title: 'Selection',
        content: [
          `story=${story.id}`,
          `variant=${variant.id}`,
          `profile=${profile.id}`,
        ].join('\n'),
      },
      {
        title: 'Coverage',
        content: `${story.profilePresets.length} profiles x ${story.variants.length} variants`,
      },
      {
        title: 'Required modes',
        content: modeStatus,
        tone: missingModes.length === 0 ? 'default' : 'muted',
      },
      {
        title: 'Source',
        content: source,
        tone: 'muted',
      },
    ],
    width: bodyWidth,
    ctx,
  }));

  return paneSurface('testing', content, width, height, ctx);
}

function paneSurface(
  title: string,
  content: Surface,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const paneWidth = Math.max(1, Math.floor(width));
  const paneHeight = Math.max(1, Math.floor(height));
  const boxed = boxSurface(content, {
    title,
    width: paneWidth,
    padding: { left: 1, right: 1 },
    ctx,
  });

  return viewportSurface({
    width: paneWidth,
    height: paneHeight,
    content: boxed,
    showScrollbar: boxed.height > paneHeight,
  });
}

function selectedVariant(model: StorybookModel, story: ComponentStory) {
  return resolveStoryVariant(story, model.variantIndexByStory[story.id] ?? 0);
}

function selectedProfile(model: StorybookModel, story: ComponentStory) {
  return resolveStoryProfilePreset(story, model.profileIndexByStory[story.id] ?? 0);
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

function cycleVariant(
  model: StorybookModel,
  stories: readonly ComponentStory[],
  delta: number,
): StorybookModel {
  const story = selectedStorybookStory(model, stories);
  const current = model.variantIndexByStory[story.id] ?? 0;
  const count = story.variants.length;
  const next = count === 0 ? 0 : ((current + delta) % count + count) % count;
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: next,
    },
    previewTimeMs: 0,
  };
}

function setProfileIndex(
  model: StorybookModel,
  stories: readonly ComponentStory[],
  index: number,
): StorybookModel {
  const story = selectedStorybookStory(model, stories);
  const next = Math.max(0, Math.min(index, story.profilePresets.length - 1));
  return {
    ...model,
    profileIndexByStory: {
      ...model.profileIndexByStory,
      [story.id]: next,
    },
    previewTimeMs: 0,
  };
}

function storyListItems(stories: readonly ComponentStory[]): readonly BrowsableListItem<string>[] {
  return stories.map((story) => ({
    label: story.title,
    value: story.id,
    description: story.family,
  }));
}

function setStoryFocus(
  state: BrowsableListState<string>,
  focusIndex: number,
): BrowsableListState<string> {
  const nextFocusIndex = Math.max(0, Math.min(focusIndex, state.items.length - 1));
  return {
    ...state,
    focusIndex: nextFocusIndex,
    scrollY: adjustScroll(nextFocusIndex, state.scrollY, state.height, state.items.length),
  };
}

function syncStoryListHeight(
  state: BrowsableListState<string>,
  height: number,
): BrowsableListState<string> {
  const nextHeight = Math.max(1, Math.floor(height));
  return {
    ...state,
    height: nextHeight,
    scrollY: adjustScroll(state.focusIndex, state.scrollY, nextHeight, state.items.length),
  };
}

function storyListHeight(rows: number): number {
  return Math.max(3, Math.floor(rows) - 8);
}

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

function fit(text: string, width: number): string {
  const targetWidth = Math.max(1, Math.floor(width));
  if (text.length <= targetWidth) {
    return text.padEnd(targetWidth);
  }
  if (targetWidth <= 1) return text.slice(0, 1);
  return `${text.slice(0, targetWidth - 1)}>`;
}
