import { readFileSync } from 'node:fs';
import {
  boxSurface,
  createSurface,
  gradientText,
  markdown,
  separatorSurface,
  wrapToWidth,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import {
  browsableListSurface,
  canvas,
  createBrowsableListState,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  hstackSurface,
  isKeyMsg,
  isMouseMsg,
  isResizeMsg,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  mapCmds,
  placeSurface,
  quit,
  type App,
  type Cmd,
  type FrameModel,
  type KeyMsg,
  type MouseMsg,
  type ResizeMsg,
} from '@flyingrobots/bijou-tui';
import {
  column,
  contentSurface,
  line,
  spacer,
  textSurface,
} from '../_shared/example-surfaces.js';
import {
  createStoryProfileContext,
  findStoryProfileIndex,
  resolveStoryProfilePreset,
  resolveStoryVariant,
  storyDocsMarkdown,
  storyPreviewSurface,
  type ComponentStory,
  type StoryMode,
} from '../_stories/protocol.js';
import { COMPONENT_STORIES, findComponentStory } from './stories.js';

const HERO_TEXT = readFileSync(new URL('../../bijou.txt', import.meta.url), 'utf8').trimEnd();
const HERO_LINES = HERO_TEXT.split(/\r?\n/);
const HERO_WIDTH = Math.max(1, ...HERO_LINES.map((lineText) => lineText.length));
const DOCS_PAGE_ID = 'learn-by-touch';

interface StoryFamily {
  readonly id: string;
  readonly label: string;
  readonly stories: readonly ComponentStory[];
}

interface RowDescriptor {
  readonly kind: 'family' | 'story';
  readonly id: string;
  readonly familyId: string;
  readonly storyId?: string;
}

interface DocsExplorerModel {
  readonly familyState: ReturnType<typeof createBrowsableListState<string>>;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly selectedStoryId?: string;
  readonly profileMode: StoryMode;
  readonly variantIndexByStory: Readonly<Record<string, number>>;
  readonly shellSplit: ReturnType<typeof createSplitPaneState>;
  readonly detailSplit: ReturnType<typeof createSplitPaneState>;
}

type ExplorerMsg =
  | { type: 'family-next' }
  | { type: 'family-prev' }
  | { type: 'family-page-down' }
  | { type: 'family-page-up' }
  | { type: 'activate-row' }
  | { type: 'expand-row' }
  | { type: 'collapse-row' }
  | { type: 'variant-next' }
  | { type: 'variant-prev' }
  | { type: 'set-profile'; mode: StoryMode }
  | { type: 'quit' };

interface RootModel {
  readonly route: 'landing' | 'docs';
  readonly columns: number;
  readonly rows: number;
  readonly docsModel: FrameModel<DocsExplorerModel>;
}

type RootMsg = { type: 'docs'; msg: ExplorerMsg };
type PulseLikeMsg = { readonly type: 'pulse'; readonly dt: number };

const STORY_FAMILIES = buildStoryFamilies(COMPONENT_STORIES);

const explorerPageKeys = createKeyMap<ExplorerMsg>()
  .group('Families', (group) => group
    .bind('down', 'Next row', { type: 'family-next' })
    .bind('up', 'Previous row', { type: 'family-prev' })
    .bind('pagedown', 'Page down', { type: 'family-page-down' })
    .bind('pageup', 'Page up', { type: 'family-page-up' })
    .bind('enter', 'Expand or select', { type: 'activate-row' })
    .bind('space', 'Expand or select', { type: 'activate-row' })
    .bind('right', 'Expand family', { type: 'expand-row' })
    .bind('left', 'Collapse family', { type: 'collapse-row' }),
  );

const explorerGlobalKeys = createKeyMap<ExplorerMsg>()
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

const explorerHelpKeys = createKeyMap<ExplorerMsg>()
  .group('Families', (group) => group
    .bind('up', 'Previous row', { type: 'family-prev' })
    .bind('down', 'Next row', { type: 'family-next' })
    .bind('pageup', 'Page up', { type: 'family-page-up' })
    .bind('pagedown', 'Page down', { type: 'family-page-down' })
    .bind('enter', 'Expand or select', { type: 'activate-row' })
    .bind('right', 'Expand family', { type: 'expand-row' })
    .bind('left', 'Collapse family', { type: 'collapse-row' }),
  )
  .group('Pane scroll', (group) => group
    .bind('tab', 'Next pane', { type: 'family-next' })
    .bind('shift+tab', 'Previous pane', { type: 'family-prev' })
    .bind('j', 'Scroll down', { type: 'family-next' })
    .bind('k', 'Scroll up', { type: 'family-prev' })
    .bind('d', 'Page down', { type: 'family-page-down' })
    .bind('u', 'Page up', { type: 'family-page-up' })
    .bind('g', 'Top', { type: 'family-prev' })
    .bind('shift+g', 'Bottom', { type: 'family-next' }),
  )
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
  .group('General', (group) => group
    .bind('?', 'Toggle help', { type: 'quit' })
    .bind('q', 'Quit', { type: 'quit' }),
  );

function buildStoryFamilies(stories: readonly ComponentStory[]): readonly StoryFamily[] {
  const families = new Map<string, { label: string; stories: ComponentStory[] }>();
  for (const story of stories) {
    const existing = families.get(story.family);
    if (existing == null) {
      families.set(story.family, { label: story.family, stories: [story] });
      continue;
    }
    existing.stories.push(story);
  }
  return Array.from(families.values()).map((family) => ({
    id: slugify(family.label),
    label: family.label,
    stories: family.stories,
  }));
}

function createInitialExplorerModel(ctx: BijouContext): DocsExplorerModel {
  const expandedFamilies = Object.fromEntries(STORY_FAMILIES.map((family) => [family.id, false]));
  return {
    familyState: createBrowsableListState({
      items: buildFamilyItems(expandedFamilies),
      height: 14,
    }),
    expandedFamilies,
    selectedStoryId: undefined,
    profileMode: ctx.mode,
    variantIndexByStory: Object.fromEntries(COMPONENT_STORIES.map((story) => [story.id, 0])),
    shellSplit: createSplitPaneState({ ratio: 0.24 }),
    detailSplit: createSplitPaneState({ ratio: 0.78 }),
  };
}

function buildFamilyItems(
  expandedFamilies: Readonly<Record<string, boolean>>,
): readonly { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  for (const family of STORY_FAMILIES) {
    const expanded = expandedFamilies[family.id] ?? false;
    items.push({
      label: `${expanded ? 'v' : '>'} ${family.label}`,
      value: `family:${family.id}`,
    });
    if (!expanded) continue;
    for (const story of family.stories) {
      items.push({
        label: `  ${story.title}`,
        value: `story:${story.id}`,
      });
    }
  }
  return items;
}

function focusedRow(model: DocsExplorerModel): RowDescriptor | undefined {
  const value = model.familyState.items[model.familyState.focusIndex]?.value;
  return value == null ? undefined : parseRowValue(value);
}

function parseRowValue(value: string): RowDescriptor {
  if (value.startsWith('family:')) {
    const familyId = value.slice('family:'.length);
    return { kind: 'family', id: value, familyId };
  }
  const storyId = value.slice('story:'.length);
  const family = STORY_FAMILIES.find((candidate) => candidate.stories.some((story) => story.id === storyId));
  return {
    kind: 'story',
    id: value,
    storyId,
    familyId: family?.id ?? slugify(storyId),
  };
}

function rebuildFamilyState(
  current: DocsExplorerModel['familyState'],
  expandedFamilies: Readonly<Record<string, boolean>>,
  preferredValue?: string,
): DocsExplorerModel['familyState'] {
  const items = buildFamilyItems(expandedFamilies);
  const next = createBrowsableListState({
    items,
    height: current.height,
  });
  const targetValue = preferredValue ?? current.items[current.focusIndex]?.value ?? items[0]?.value;
  const focusIndex = Math.max(0, items.findIndex((item) => item.value === targetValue));
  return {
    ...next,
    focusIndex,
    scrollY: adjustScroll(focusIndex, current.scrollY, current.height, items.length),
  };
}

function adjustScroll(focusIndex: number, scrollY: number, height: number, totalItems: number): number {
  let nextScrollY = scrollY;
  if (focusIndex < nextScrollY) {
    nextScrollY = focusIndex;
  } else if (focusIndex >= nextScrollY + height) {
    nextScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(nextScrollY, maxScroll);
}

function selectedStory(model: DocsExplorerModel): ComponentStory | undefined {
  return model.selectedStoryId == null ? undefined : findComponentStory(model.selectedStoryId);
}

function selectedVariantIndex(model: DocsExplorerModel, storyId: string): number {
  return model.variantIndexByStory[storyId] ?? 0;
}

function cycleVariantIndex(model: DocsExplorerModel, delta: number): DocsExplorerModel {
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return model;
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

function familyContainsStory(familyId: string, storyId: string): boolean {
  return STORY_FAMILIES.some((family) =>
    family.id === familyId && family.stories.some((story) => story.id === storyId));
}

function toggleFamily(model: DocsExplorerModel, familyId: string): DocsExplorerModel {
  const expanded = model.expandedFamilies[familyId] ?? false;
  const nextExpandedFamilies = {
    ...model.expandedFamilies,
    [familyId]: !expanded,
  };
  const nextSelectedStoryId = expanded && model.selectedStoryId != null && familyContainsStory(familyId, model.selectedStoryId)
    ? undefined
    : model.selectedStoryId;
  return {
    ...model,
    expandedFamilies: nextExpandedFamilies,
    selectedStoryId: nextSelectedStoryId,
    familyState: rebuildFamilyState(model.familyState, nextExpandedFamilies, `family:${familyId}`),
  };
}

function expandFocusedFamily(model: DocsExplorerModel): DocsExplorerModel {
  const row = focusedRow(model);
  if (row?.kind !== 'family') return model;
  if (model.expandedFamilies[row.familyId]) return model;
  return toggleFamily(model, row.familyId);
}

function collapseFocusedFamily(model: DocsExplorerModel): DocsExplorerModel {
  const row = focusedRow(model);
  if (row == null) return model;
  if (row.kind === 'family') {
    if (!(model.expandedFamilies[row.familyId] ?? false)) return model;
    return toggleFamily(model, row.familyId);
  }

  const family = STORY_FAMILIES.find((candidate) => candidate.id === row.familyId);
  if (family == null) return model;
  return {
    ...model,
    selectedStoryId: model.selectedStoryId === row.storyId ? undefined : model.selectedStoryId,
    expandedFamilies: {
      ...model.expandedFamilies,
      [row.familyId]: false,
    },
    familyState: rebuildFamilyState(
      model.familyState,
      {
        ...model.expandedFamilies,
        [row.familyId]: false,
      },
      `family:${row.familyId}`,
    ),
  };
}

function activateFocusedRow(model: DocsExplorerModel): DocsExplorerModel {
  const row = focusedRow(model);
  if (row == null) return model;
  if (row.kind === 'family') {
    return toggleFamily(model, row.familyId);
  }
  return {
    ...model,
    selectedStoryId: row.storyId,
  };
}

function renderLanding(model: RootModel, ctx: BijouContext): Surface {
  const width = Math.max(1, model.columns);
  const height = Math.max(1, model.rows);
  const background = createLandingBackground(width, height, ctx);
  const content = createLandingContent(width, height, ctx);
  background.blit(placeSurface(content, {
    width,
    height,
    hAlign: 'center',
    vAlign: 'middle',
  }), 0, 0);
  return background;
}

function createLandingBackground(width: number, height: number, ctx: BijouContext): Surface {
  const surface = createSurface(width, height, {
    char: ' ',
    bg: ctx.surface('primary').bg,
    empty: false,
  });
  const stars = canvas(width, height, ({ u, v }) => {
    const band = Math.sin((u * 11.5) + (v * 7.2)) + Math.cos((u * 3.1) - (v * 9.4));
    if (band > 1.55) {
      return {
        char: '·',
        fg: ctx.status('info').hex,
        modifiers: ['dim'],
      };
    }
    if (band > 1.3) {
      return {
        char: '.',
        fg: ctx.border('muted').hex,
        modifiers: ['dim'],
      };
    }
    return { char: ' ', empty: true };
  });
  surface.blit(stars, 0, 0);
  return surface;
}

function createLandingContent(width: number, height: number, ctx: BijouContext): Surface {
  const innerWidth = Math.max(24, Math.min(Math.max(24, width - 8), 138));
  const showFullHero = innerWidth >= HERO_WIDTH + 2 && height >= 34;
  const hero = createHeroSurface(innerWidth, showFullHero, ctx);
  const summary = makeWhitespaceTransparent(paragraphSurface(
    'The docs are the demo. Learn the component families, compare graceful lowering across output profiles, and step into the framework through a surface built with Bijou itself.',
    Math.max(32, innerWidth - 4),
  ));
  const stats = createStatsSurface(innerWidth, ctx);
  const cta = boxSurface(column([
    line('Press Enter to enter the docs.'),
    line('Then browse families on the left and variants on the right.'),
  ]), {
    title: 'Enter the Docs',
    width: innerWidth,
    borderToken: ctx.border('primary'),
    ctx,
  });
  const footer = makeWhitespaceTransparent(line('Enter continue • q quit', innerWidth));

  return column([
    makeWhitespaceTransparent(contentSurface(gradientText('Bijou Docs', ctx.theme.theme.gradient.brand, { style: ctx.style }))),
    spacer(1, 1),
    hero,
    spacer(1, 1),
    summary,
    spacer(1, 1),
    stats,
    spacer(1, 1),
    cta,
    spacer(1, 1),
    footer,
  ]);
}

function createHeroSurface(width: number, showFullHero: boolean, ctx: BijouContext): Surface {
  const gradient = ctx.theme.theme.gradient.brand;
  if (showFullHero) {
    const hero = HERO_LINES.map((lineText) => gradientText(lineText, gradient, { style: ctx.style })).join('\n');
    return makeWhitespaceTransparent(contentSurface(hero));
  }

  const compact = [
    gradientText('BIJOU', gradient, { style: ctx.style }),
    gradientText('Learn by Touch', gradient, { style: ctx.style }),
  ].join('\n');

  return boxSurface(contentSurface(compact), {
    title: 'Surface-native docs',
    width: Math.max(32, Math.min(width, 64)),
    borderToken: ctx.border('primary'),
    ctx,
  });
}

function createStatsSurface(width: number, ctx: BijouContext): Surface {
  const cards = [
    createStatCard('Families', String(STORY_FAMILIES.length), ctx),
    createStatCard('Stories', String(COMPONENT_STORIES.length), ctx),
    createStatCard('Profiles', '4', ctx),
  ];
  const horizontal = hstackSurface(2, ...cards);
  if (width >= horizontal.width) {
    return horizontal;
  }

  return column(cards);
}

function createStatCard(label: string, value: string, ctx: BijouContext): Surface {
  return boxSurface(column([
    contentSurface(gradientText(value, ctx.theme.theme.gradient.brand, { style: ctx.style })),
    line(label),
  ]), {
    width: 18,
    borderToken: ctx.border('muted'),
    ctx,
  });
}

function paragraphSurface(text: string, width: number): Surface {
  const wrapped = wrapToWidth(text, Math.max(1, width));
  return textSurface(wrapped.join('\n'), Math.max(1, width), Math.max(1, wrapped.length));
}

function makeWhitespaceTransparent(surface: Surface): Surface {
  const result = surface.clone();
  for (let y = 0; y < result.height; y++) {
    for (let x = 0; x < result.width; x++) {
      const cell = result.get(x, y);
      if (cell.empty || cell.char !== ' ' || cell.bg != null) continue;
      result.set(x, y, { char: ' ', empty: true });
    }
  }
  return result;
}

function renderFamiliesPane(model: DocsExplorerModel, width: number, height: number, ctx: BijouContext): Surface {
  const visibleHeight = Math.max(3, height - 2);
  const list = browsableListSurface(
    { ...model.familyState, height: visibleHeight },
    { width: Math.max(1, width), showScrollbar: true, ctx },
  );
  const footer = line(' arrows browse • Enter expand/select ', width);

  return column([
    separatorSurface({ label: 'component families', width, ctx }),
    list,
    footer,
  ]);
}

function renderEmptyStoryPane(width: number, ctx: BijouContext): Surface {
  const bodyWidth = Math.max(28, width - 4);
  const callout = boxSurface(column([
    line('Select a component to learn more.'),
    spacer(),
    paragraphSurface(
      'Start in the families lane. Expand a family with Enter, choose a component, then compare variants and profiles without leaving the page.',
      Math.max(24, bodyWidth - 2),
    ),
    spacer(),
    line('Tip: 1-4 switch profiles • ,/. cycle variants'),
  ]), {
    title: 'Start here',
    width: Math.max(1, width),
    borderToken: ctx.border('primary'),
    ctx,
  });

  return column([
    separatorSurface({ label: 'select a component to learn more', width, ctx }),
    spacer(1, 1),
    callout,
  ]);
}

function renderStoryPane(model: DocsExplorerModel, width: number, ctx: BijouContext): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return renderEmptyStoryPane(width, ctx);
  }

  const profileIndex = findStoryProfileIndex(story, model.profileMode);
  const preset = resolveStoryProfilePreset(story, profileIndex);
  const variant = resolveStoryVariant(story, selectedVariantIndex(model, story.id));
  const previewWidth = Math.max(20, Math.min(Math.max(20, width - 6), preset.width));
  const previewCtx = createStoryProfileContext(ctx, preset, {
    width: previewWidth,
    height: 14,
  });
  const preview = storyPreviewSurface(variant.render({
    width: previewWidth,
    ctx: previewCtx,
    state: variant.initialState as never,
  }));
  const previewCard = boxSurface(placeSurface(preview, {
    width: Math.max(preview.width, previewWidth),
    height: preview.height,
    hAlign: 'center',
    vAlign: 'top',
  }), {
    title: `live preview • ${preset.label} • ${variant.label}`,
    width: Math.max(24, width),
    borderToken: ctx.border('muted'),
    ctx,
  });
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: Math.max(24, width - 2),
    ctx,
  });

  return column([
    separatorSurface({ label: `docs • ${story.title}`, width, ctx }),
    line(' scroll: j/k • d/u • g/G • mouse wheel ', width),
    spacer(1, 1),
    previewCard,
    spacer(1, 1),
    contentSurface(docs),
  ]);
}

function renderVariantsPane(model: DocsExplorerModel, width: number, height: number, ctx: BijouContext): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return column([
      separatorSurface({ label: 'variants', width, ctx }),
      spacer(1, 1),
      boxSurface(paragraphSurface(
        'Variants appear here once a component is selected.',
        Math.max(20, width - 4),
      ), {
        width: Math.max(1, width),
        borderToken: ctx.border('muted'),
        ctx,
      }),
    ]);
  }

  const currentVariantIndex = selectedVariantIndex(model, story.id);
  const items = story.variants.map((variant) => ({
    label: variant.label,
    value: variant.id,
  }));
  const list = browsableListSurface({
    items,
    focusIndex: currentVariantIndex,
    scrollY: adjustScroll(currentVariantIndex, 0, Math.max(3, height - 8), items.length),
    height: Math.max(3, height - 8),
  }, {
    width: Math.max(1, width),
    showScrollbar: items.length > Math.max(3, height - 8),
    ctx,
  });
  const variant = resolveStoryVariant(story, currentVariantIndex);
  const description = boxSurface(column([
    line(`Profile: ${resolveStoryProfilePreset(story, findStoryProfileIndex(story, model.profileMode)).label}`),
    spacer(),
    paragraphSurface(
      variant.description ?? 'No extra description for this variant.',
      Math.max(20, width - 4),
    ),
  ]), {
    title: 'active variant',
    width: Math.max(1, width),
    borderToken: ctx.border('muted'),
    ctx,
  });

  return column([
    separatorSurface({ label: `variants • ${story.title}`, width, ctx }),
    list,
    spacer(1, 1),
    description,
    spacer(1, 1),
    line(' ,/. cycle • 1-4 profiles ', width),
  ]);
}

function createDocsExplorerApp(ctx: BijouContext): App<FrameModel<DocsExplorerModel>, ExplorerMsg> {
  return createFramedApp<DocsExplorerModel, ExplorerMsg>({
    title: 'Bijou Docs',
    globalKeys: explorerGlobalKeys,
    helpLineSource: () => explorerHelpKeys,
    pages: [{
      id: DOCS_PAGE_ID,
      title: 'Learn by Touch',
      init: () => [createInitialExplorerModel(ctx), []],
      update(msg, model) {
        switch (msg.type) {
          case 'family-next':
            return [{ ...model, familyState: listFocusNext(model.familyState) }, []];
          case 'family-prev':
            return [{ ...model, familyState: listFocusPrev(model.familyState) }, []];
          case 'family-page-down':
            return [{ ...model, familyState: listPageDown(model.familyState) }, []];
          case 'family-page-up':
            return [{ ...model, familyState: listPageUp(model.familyState) }, []];
          case 'activate-row':
            return [activateFocusedRow(model), []];
          case 'expand-row':
            return [expandFocusedFamily(model), []];
          case 'collapse-row':
            return [collapseFocusedFamily(model), []];
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
      keyMap: explorerPageKeys,
      layout(model) {
        return {
          kind: 'split',
          splitId: 'docs-shell',
          direction: 'row',
          state: model.shellSplit,
          paneA: {
            kind: 'pane',
            paneId: 'family-nav',
            render: (width, height) => renderFamiliesPane(model, width, height, ctx),
          },
          paneB: {
            kind: 'split',
            splitId: 'docs-detail',
            direction: 'row',
            state: model.detailSplit,
            paneA: {
              kind: 'pane',
              paneId: 'story-content',
              render: (width) => renderStoryPane(model, width, ctx),
            },
            paneB: {
              kind: 'pane',
              paneId: 'story-variants',
              render: (width, height) => renderVariantsPane(model, width, height, ctx),
            },
          },
        };
      },
    }],
  });
}

export function createDocsApp(ctx: BijouContext): App<RootModel, RootMsg> {
  const explorer = createDocsExplorerApp(ctx);

  function mapExplorer(cmds: Cmd<ExplorerMsg>[]): Cmd<RootMsg>[] {
    return mapCmds(cmds, (msg) => ({ type: 'docs', msg }));
  }

  function updateExplorer(
    message: KeyMsg | ResizeMsg | MouseMsg | PulseLikeMsg | ExplorerMsg,
    model: RootModel,
  ): [RootModel, Cmd<RootMsg>[]] {
    const [docsModel, cmds] = explorer.update(message, model.docsModel);
    return [{ ...model, docsModel }, mapExplorer(cmds)];
  }

  return {
    init() {
      const [docsModel, cmds] = explorer.init();
      return [{
        route: 'landing',
        columns: Math.max(1, ctx.runtime.columns),
        rows: Math.max(1, ctx.runtime.rows),
        docsModel,
      }, mapExplorer(cmds)];
    },

    update(msg, model) {
      if (msg.type === 'docs') {
        return updateExplorer(msg.msg, model);
      }

      if (isResizeMsg(msg)) {
        const resizedModel: RootModel = {
          ...model,
          columns: msg.columns,
          rows: msg.rows,
        };
        return updateExplorer(msg, resizedModel);
      }

      if (model.route === 'landing') {
        if (isKeyMsg(msg)) {
          if (msg.key === 'enter' || msg.key === 'space') {
            return [{ ...model, route: 'docs' }, []];
          }
          if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
            return [model, [quit()]];
          }
        }
        return [model, []];
      }

      if (isKeyMsg(msg) || isMouseMsg(msg) || msg.type === 'pulse') {
        return updateExplorer(msg, model);
      }

      return [model, []];
    },

    view(model) {
      if (model.route === 'landing') {
        return renderLanding(model, ctx);
      }
      return explorer.view(model.docsModel);
    },

    routeRuntimeIssue(issue) {
      const routed = explorer.routeRuntimeIssue?.(issue);
      return routed === undefined ? undefined : { type: 'docs', msg: routed };
    },
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'family';
}
