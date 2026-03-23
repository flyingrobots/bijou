import type { BijouContext } from '@flyingrobots/bijou';
import { markdown, separatorSurface } from '@flyingrobots/bijou';
import {
  browsableListSurface,
  createBrowsableListState,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  quit,
  type App,
} from '@flyingrobots/bijou-tui';
import { column, contentSurface, line, spacer } from '../_shared/example-surfaces.js';
import {
  createStoryProfileContext,
  findStoryProfileIndex,
  resolveStoryProfilePreset,
  resolveStoryVariant,
  storyDocsMarkdown,
  storyPreviewSurface,
  type StoryMode,
} from '../_stories/protocol.js';
import { COMPONENT_STORIES, findComponentStory } from './stories.js';

type Msg =
  | { type: 'story-next' }
  | { type: 'story-prev' }
  | { type: 'story-page-down' }
  | { type: 'story-page-up' }
  | { type: 'variant-next' }
  | { type: 'variant-prev' }
  | { type: 'set-profile'; mode: StoryMode }
  | { type: 'quit' };

interface DocsPageModel {
  readonly listState: ReturnType<typeof createBrowsableListState<string>>;
  readonly profileMode: StoryMode;
  readonly variantIndexByStory: Readonly<Record<string, number>>;
  readonly shellSplit: ReturnType<typeof createSplitPaneState>;
  readonly detailSplit: ReturnType<typeof createSplitPaneState>;
}

function createInitialModel(ctx: BijouContext): DocsPageModel {
  return {
    listState: createBrowsableListState({
      items: COMPONENT_STORIES.map((story) => ({
        label: story.title,
        value: story.id,
      })),
      height: 12,
    }),
    profileMode: ctx.mode,
    variantIndexByStory: Object.fromEntries(COMPONENT_STORIES.map((story) => [story.id, 0])),
    shellSplit: createSplitPaneState({ ratio: 0.24 }),
    detailSplit: createSplitPaneState({ ratio: 0.48 }),
  };
}

function selectedStory(model: DocsPageModel) {
  const selectedId = model.listState.items[model.listState.focusIndex]?.value;
  return selectedId == null ? COMPONENT_STORIES[0] : findComponentStory(selectedId) ?? COMPONENT_STORIES[0];
}

function selectedVariantIndex(model: DocsPageModel, storyId: string): number {
  return model.variantIndexByStory[storyId] ?? 0;
}

function cycleVariantIndex(model: DocsPageModel, delta: number): DocsPageModel {
  const story = selectedStory(model);
  const current = selectedVariantIndex(model, story.id);
  const count = story.variants.length;
  const next = ((current + delta) % count + count) % count;
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: next,
    },
  };
}

function renderStoryListPane(model: DocsPageModel, width: number, height: number, ctx: BijouContext) {
  const story = selectedStory(model);
  const visibleHeight = Math.max(3, height - 2);
  const list = browsableListSurface(
    { ...model.listState, height: visibleHeight },
    { width: Math.max(1, width), showScrollbar: true, ctx },
  );
  const footer = line(` ${model.listState.focusIndex + 1}/${model.listState.items.length} • ${story.family}`, width);

  return column([
    separatorSurface({ label: 'stories', width, ctx }),
    list,
    footer,
  ]);
}

function renderStoryDocsPane(model: DocsPageModel, width: number, ctx: BijouContext) {
  const story = selectedStory(model);
  const profileIndex = findStoryProfileIndex(story, model.profileMode);
  const variant = resolveStoryVariant(story, selectedVariantIndex(model, story.id));
  const preset = resolveStoryProfilePreset(story, profileIndex);
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: Math.max(24, width - 2),
    ctx,
  });

  return column([
    separatorSurface({ label: `docs • ${story.title}`, width, ctx }),
    contentSurface(docs),
  ]);
}

function renderStoryDemoPane(
  model: DocsPageModel,
  width: number,
  height: number,
  ctx: BijouContext,
) {
  const story = selectedStory(model);
  const profileIndex = findStoryProfileIndex(story, model.profileMode);
  const preset = resolveStoryProfilePreset(story, profileIndex);
  const variant = resolveStoryVariant(story, selectedVariantIndex(model, story.id));
  const previewWidth = Math.max(20, Math.min(Math.max(20, width), preset.width));
  const previewHeight = Math.max(8, height - 2);
  const previewCtx = createStoryProfileContext(ctx, preset, {
    width: previewWidth,
    height: previewHeight,
  });
  const preview = variant.render({
    width: previewWidth,
    ctx: previewCtx,
    state: variant.initialState as never,
  });
  const footer = line(
    ` ${preset.label} • ${preset.mode} • ${previewWidth} cols • ${variant.label}`,
    Math.max(width, previewWidth),
  );

  return column([
    separatorSurface({ label: `demo • ${story.title}`, width, ctx }),
    storyPreviewSurface(preview),
    spacer(1, 1),
    footer,
  ]);
}

const pageKeys = createKeyMap<Msg>()
  .group('Stories', (group) => group
    .bind('down', 'Next story', { type: 'story-next' })
    .bind('j', 'Next story', { type: 'story-next' })
    .bind('up', 'Previous story', { type: 'story-prev' })
    .bind('k', 'Previous story', { type: 'story-prev' })
    .bind('pagedown', 'Page down', { type: 'story-page-down' })
    .bind('d', 'Page down', { type: 'story-page-down' })
    .bind('pageup', 'Page up', { type: 'story-page-up' })
    .bind('u', 'Page up', { type: 'story-page-up' }),
  );

const globalKeys = createKeyMap<Msg>()
  .group('Profiles', (group) => group
    .bind('1', 'Rich profile', { type: 'set-profile', mode: 'interactive' })
    .bind('2', 'Static profile', { type: 'set-profile', mode: 'static' })
    .bind('3', 'Pipe profile', { type: 'set-profile', mode: 'pipe' })
    .bind('4', 'Accessible profile', { type: 'set-profile', mode: 'accessible' }),
  )
  .group('Variants', (group) => group
    .bind('.', 'Next variant', { type: 'variant-next' })
    .bind(',', 'Previous variant', { type: 'variant-prev' }),
  )
  .bind('q', 'Quit', { type: 'quit' })
  .bind('ctrl+c', 'Quit', { type: 'quit' });

export function createDocsApp(ctx: BijouContext): App<unknown, Msg> {
  return createFramedApp<DocsPageModel, Msg>({
    title: 'Bijou Docs Preview',
    globalKeys,
    pages: [{
      id: 'learn-by-touch',
      title: 'Learn by Touch',
      init: () => [createInitialModel(ctx), []],
      update(msg, model) {
        switch (msg.type) {
          case 'story-next':
            return [{ ...model, listState: listFocusNext(model.listState) }, []];
          case 'story-prev':
            return [{ ...model, listState: listFocusPrev(model.listState) }, []];
          case 'story-page-down':
            return [{ ...model, listState: listPageDown(model.listState) }, []];
          case 'story-page-up':
            return [{ ...model, listState: listPageUp(model.listState) }, []];
          case 'variant-next':
            return [cycleVariantIndex(model, 1), []];
          case 'variant-prev':
            return [cycleVariantIndex(model, -1), []];
          case 'set-profile':
            return [{ ...model, profileMode: msg.mode }, []];
          case 'quit':
            return [model, [quit()]];
        }
      },
      keyMap: pageKeys,
      layout(model) {
        return {
          kind: 'split',
          splitId: 'docs-shell',
          direction: 'row',
          state: model.shellSplit,
          paneA: {
            kind: 'pane',
            paneId: 'story-list',
            render: (width, height) => renderStoryListPane(model, width, height, ctx),
          },
          paneB: {
            kind: 'split',
            splitId: 'docs-detail',
            direction: 'column',
            state: model.detailSplit,
            paneA: {
              kind: 'pane',
              paneId: 'story-docs',
              render: (width) => renderStoryDocsPane(model, width, ctx),
            },
            paneB: {
              kind: 'pane',
              paneId: 'story-demo',
              render: (width, height) => renderStoryDemoPane(model, width, height, ctx),
            },
          },
        };
      },
    }],
  });
}
