import { readFileSync } from 'node:fs';
import {
  boxSurface,
  createSurface,
  lerp3,
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

const LOGO_TEXT = readFileSync(new URL('../../assets/bijou.txt', import.meta.url), 'utf8').trimEnd();
const LOGO_LINES = LOGO_TEXT.split(/\r?\n/);
const LOGO_WIDTH = Math.max(1, ...LOGO_LINES.map((lineText) => lineText.length));
const LOGO_HEIGHT = LOGO_LINES.length;
const BACKGROUND_TEXT = readFileSync(new URL('../../assets/background.txt', import.meta.url), 'utf8').trimEnd();
const BACKGROUND_LINES = BACKGROUND_TEXT.split(/\r?\n/);
const BACKGROUND_WIDTH = Math.max(1, ...BACKGROUND_LINES.map((lineText) => lineText.length));
const BACKGROUND_HEIGHT = BACKGROUND_LINES.length;
const DOCS_PAGE_ID = 'learn-by-touch';
const DOCS_SIDEBAR_WIDTH = 32;

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
  readonly landingTimeMs: number;
  readonly landingThemeIndex: number;
  readonly docsModel: FrameModel<DocsExplorerModel>;
}

type RootMsg = { type: 'docs'; msg: ExplorerMsg };
type PulseLikeMsg = { readonly type: 'pulse'; readonly dt: number };

interface LandingThemeTokens {
  readonly id: string;
  readonly background: string;
  readonly waveGradient: readonly [string, string, string];
  readonly logoGradient: readonly [string, string, string];
}

const STORY_FAMILIES = buildStoryFamilies(COMPONENT_STORIES);
const LANDING_THEMES: readonly LandingThemeTokens[] = [
  {
    id: 'storybook-workstation',
    background: '#18172b',
    waveGradient: ['#2f3f66', '#5f87c8', '#f2c96b'],
    logoGradient: ['#8ba8ff', '#f3b57a', '#ffd86d'],
  },
  {
    id: 'cabinet-of-curiosities',
    background: '#1d1720',
    waveGradient: ['#55413a', '#9f7754', '#d7ba7f'],
    logoGradient: ['#8eb489', '#d8b26e', '#d47a4f'],
  },
  {
    id: 'soft-arcade',
    background: '#161a26',
    waveGradient: ['#31557c', '#67a2d3', '#f4a57c'],
    logoGradient: ['#9bb6ff', '#f0a0bf', '#ffd76e'],
  },
  {
    id: 'moss-and-embers',
    background: '#171d1b',
    waveGradient: ['#40594b', '#84af86', '#ef9d51'],
    logoGradient: ['#6fa9a3', '#dfbf73', '#ee7c56'],
  },
  {
    id: 'paper-moon',
    background: '#1f1d24',
    waveGradient: ['#52506f', '#8c8ab8', '#f3ceb0'],
    logoGradient: ['#8eb7d8', '#d9a7c7', '#f4d98b'],
  },
];

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
  .group('Browse', (group) => group
    .bind('up', 'Browse', { type: 'family-prev' })
    .bind('down', 'Browse', { type: 'family-next' })
    .bind('enter', 'Open', { type: 'activate-row' })
    .bind('tab', 'Next pane', { type: 'family-next' }),
  )
  .group('Profiles', (group) => group
    .bind('1', 'Rich', { type: 'set-profile', mode: 'interactive' })
    .bind('2', 'Static', { type: 'set-profile', mode: 'static' })
    .bind('3', 'Pipe', { type: 'set-profile', mode: 'pipe' })
    .bind('4', 'Accessible', { type: 'set-profile', mode: 'accessible' }),
  )
  .group('Variants', (group) => group
    .bind('.', 'Next', { type: 'variant-next' })
    .bind(',', 'Prev', { type: 'variant-prev' }),
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
  const tokens = resolveLandingTheme(model.landingThemeIndex);
  const surface = createSurface(width, height, {
    char: ' ',
    bg: tokens.background,
    empty: false,
  });
  surface.blit(createLandingBackground(width, height, model.landingTimeMs, tokens), 0, 0);

  const logoWidth = Math.max(1, Math.min(LOGO_WIDTH, width - Math.min(12, Math.max(4, Math.floor(width * 0.08)))));
  const logoHeight = Math.max(1, Math.min(LOGO_HEIGHT, height - Math.min(8, Math.max(3, Math.floor(height * 0.12)))));
  const logo = createLogoSurface(logoWidth, logoHeight, model.landingTimeMs, tokens);
  surface.blit(logo, Math.floor((width - logo.width) / 2), Math.floor((height - logo.height) / 2));
  return surface;
}

function createLandingBackground(
  width: number,
  height: number,
  timeMs: number,
  tokens: LandingThemeTokens,
): Surface {
  const time = timeMs / 1000;
  const baseX = Math.floor((BACKGROUND_WIDTH - width) / 2);
  const baseY = Math.floor((BACKGROUND_HEIGHT - height) / 2);

  return canvas(width, height, ({ u, v, time: shaderTime }) => {
    const x = Math.round(u * (width - 1 || 1));
    const y = Math.round(v * (height - 1 || 1));
    const rowShift = Math.round(
      (Math.sin((y * 0.075) + (shaderTime * 0.7)) * 18)
      + (Math.cos((y * 0.03) - (shaderTime * 0.35)) * 7),
    );
    const columnShift = Math.round(Math.sin((x * 0.028) + (shaderTime * 0.42)) * 2);
    const sourceX = mod(baseX + x + rowShift, BACKGROUND_WIDTH);
    const sourceY = mod(baseY + y + columnShift, BACKGROUND_HEIGHT);
    const sourceChar = BACKGROUND_LINES[sourceY]?.[sourceX] ?? ' ';
    const density = densityFromChar(sourceChar);
    if (density === 0) return { char: ' ', empty: true };

    const wave = 0.54
      + (Math.sin((x * 0.042) + (y * 0.016) + (shaderTime * 1.45)) * 0.24)
      + (Math.cos((x * 0.012) - (y * 0.085) + (shaderTime * 0.95)) * 0.22);
    const level = clamp01(density * wave);
    const char = densityGlyph(level, { airy: true });
    if (char === ' ') return { char: ' ', empty: true };

    const colorT = clamp01(
      (u * 0.66)
      + (0.22 * (0.5 + (Math.sin((shaderTime * 0.3) + (v * 5.2)) * 0.5)))
      + (0.08 * Math.sin((shaderTime * 0.55) + (x * 0.02))),
    );
    const [r, g, b] = lerpTheme(tokens.waveGradient, colorT);

    return {
      char,
      fg: rgbHex(r, g, b),
      modifiers: level < 0.52 ? ['dim'] : undefined,
    };
  }, { time });
}

function createLogoSurface(
  width: number,
  height: number,
  timeMs: number,
  tokens: LandingThemeTokens,
): Surface {
  const shader = canvas(LOGO_WIDTH, LOGO_HEIGHT, ({ u, v, time }) => {
    const shimmer = 0.46
      + (Math.sin((u * 7.8) - (v * 5.6) + (time * 2.3)) * 0.24)
      + (Math.cos((u * 3.4) + (v * 9.1) - (time * 1.6)) * 0.18)
      + (Math.sin((u * 18.0) + (time * 5.5)) * 0.12);
    const level = clamp01(shimmer);
    const colorT = clamp01(
      (u * 0.78)
      + ((1 - v) * 0.14)
      + (0.08 * Math.sin((time * 0.9) + (u * 5.2))),
    );
    const [r, g, b] = lerpTheme(tokens.logoGradient, colorT);
    return {
      char: densityGlyph(level, { airy: false }),
      fg: rgbHex(r, g, b),
      modifiers: level > 0.7 ? ['bold'] : undefined,
    };
  }, { time: timeMs / 1000 });

  const masked = createSurface(LOGO_WIDTH, LOGO_HEIGHT);
  for (let y = 0; y < LOGO_HEIGHT; y++) {
    const lineText = LOGO_LINES[y]!.padEnd(LOGO_WIDTH);
    for (let x = 0; x < LOGO_WIDTH; x++) {
      if (lineText[x] === ' ') {
        masked.set(x, y, { char: ' ', empty: true });
        continue;
      }
      const shaderCell = shader.get(x, y);
      masked.set(x, y, {
        ...shaderCell,
        char: reinforceGlyph(lineText[x]!, shaderCell.char),
      });
    }
  }

  return centerCropSurface(masked, width, height);
}

function paragraphSurface(text: string, width: number): Surface {
  const wrapped = wrapToWidth(text, Math.max(1, width));
  return textSurface(wrapped.join('\n'), Math.max(1, width), Math.max(1, wrapped.length));
}

function centerCropSurface(content: Surface, width: number, height: number): Surface {
  const targetWidth = Math.max(1, width);
  const targetHeight = Math.max(1, height);
  const result = createSurface(targetWidth, targetHeight);

  const srcX = content.width > targetWidth
    ? Math.floor((content.width - targetWidth) / 2)
    : 0;
  const srcY = content.height > targetHeight
    ? Math.floor((content.height - targetHeight) / 2)
    : 0;

  const drawWidth = Math.min(targetWidth, content.width);
  const drawHeight = Math.min(targetHeight, content.height);
  const destX = content.width < targetWidth
    ? Math.floor((targetWidth - content.width) / 2)
    : 0;
  const destY = content.height < targetHeight
    ? Math.floor((targetHeight - content.height) / 2)
    : 0;

  result.blit(content, destX, destY, srcX, srcY, drawWidth, drawHeight);
  return result;
}

function densityFromChar(char: string): number {
  switch (char) {
    case '█':
      return 1;
    case '▓':
      return 0.78;
    case '▒':
      return 0.56;
    case '░':
      return 0.32;
    case '·':
    case '.':
      return 0.14;
    default:
      return 0;
  }
}

function densityGlyph(level: number, options: { readonly airy: boolean }): string {
  if (level <= 0.08) return ' ';
  if (options.airy) {
    if (level > 0.82) return '▓';
    if (level > 0.58) return '▒';
    if (level > 0.34) return '░';
    return '·';
  }
  if (level > 0.84) return '█';
  if (level > 0.66) return '▓';
  if (level > 0.44) return '▒';
  return '░';
}

function reinforceGlyph(source: string, shaderChar: string): string {
  const sourceDensity = densityFromChar(source);
  const shaderDensity = densityFromChar(shaderChar);
  return shaderDensity >= sourceDensity ? shaderChar : densityGlyph(sourceDensity, { airy: false });
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolveLandingTheme(index: number): LandingThemeTokens {
  return LANDING_THEMES[mod(index, LANDING_THEMES.length)]!;
}

function nextLandingThemeIndex(current: number, delta: number): number {
  return mod(current + delta, LANDING_THEMES.length);
}

function lerpTheme(
  gradient: readonly [string, string, string],
  t: number,
): readonly [number, number, number] {
  return lerp3([
    { pos: 0, color: hexToRgb(gradient[0]) },
    { pos: 0.5, color: hexToRgb(gradient[1]) },
    { pos: 1, color: hexToRgb(gradient[2]) },
  ], t);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function renderFamiliesPane(model: DocsExplorerModel, width: number, height: number, ctx: BijouContext): Surface {
  const visibleHeight = Math.max(3, height - 2);
  const body = createSurface(Math.max(1, width), visibleHeight);
  const start = model.familyState.scrollY;
  const end = Math.min(model.familyState.items.length, start + visibleHeight);

  for (let index = start; index < end; index++) {
    const row = parseRowValue(model.familyState.items[index]!.value);
    body.blit(
      renderFamilyRow({
        row,
        width,
        focused: index === model.familyState.focusIndex,
        selectedStoryId: model.selectedStoryId,
        expandedFamilies: model.expandedFamilies,
        ctx,
      }),
      0,
      index - start,
    );
  }

  const footer = line(' ↑/↓ browse • Enter open • Tab next pane ', width);

  return column([
    separatorSurface({ label: 'component families', width, ctx }),
    body,
    footer,
  ]);
}

function renderEmptyStoryPane(width: number, ctx: BijouContext): Surface {
  const bodyWidth = Math.max(28, width - 6);
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
    width: Math.max(24, width - 1),
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
    width: Math.max(24, width - 1),
    borderToken: ctx.border('muted'),
    ctx,
  });
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: Math.max(24, width - 3),
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
        Math.max(20, width - 6),
      ), {
        width: Math.max(22, width - 1),
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
      Math.max(20, width - 6),
    ),
  ]), {
    title: 'active variant',
    width: Math.max(22, width - 1),
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
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    globalKeys: explorerGlobalKeys,
    helpLineSource: () => explorerHelpKeys,
    pages: [{
      id: DOCS_PAGE_ID,
      title: 'Learn by Touch',
      init: () => [createInitialExplorerModel(ctx), []],
      helpSource: explorerHelpKeys,
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
          kind: 'grid',
          gridId: 'docs-shell',
          columns: [DOCS_SIDEBAR_WIDTH, '1fr', DOCS_SIDEBAR_WIDTH],
          rows: ['1fr'],
          areas: ['family main variants'],
          gap: 1,
          cells: {
            family: {
              kind: 'pane',
              paneId: 'family-nav',
              render: (width, height) => renderFamiliesPane(model, width, height, ctx),
            },
            main: {
              kind: 'pane',
              paneId: 'story-content',
              render: (width) => renderStoryPane(model, width, ctx),
            },
            variants: {
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
        landingTimeMs: 0,
        landingThemeIndex: 0,
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
        if (msg.type === 'pulse') {
          return [{ ...model, landingTimeMs: model.landingTimeMs + Math.round(msg.dt * 1000) }, []];
        }
        if (isKeyMsg(msg)) {
          if (msg.key === 'left') {
            return [{ ...model, landingThemeIndex: nextLandingThemeIndex(model.landingThemeIndex, -1) }, []];
          }
          if (msg.key === 'right') {
            return [{ ...model, landingThemeIndex: nextLandingThemeIndex(model.landingThemeIndex, 1) }, []];
          }
          if (!msg.ctrl && !msg.alt && /^[1-5]$/.test(msg.key)) {
            return [{ ...model, landingThemeIndex: Number(msg.key) - 1 }, []];
          }
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

function renderFamilyRow(options: {
  readonly row: RowDescriptor;
  readonly width: number;
  readonly focused: boolean;
  readonly selectedStoryId?: string;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly ctx: BijouContext;
}): Surface {
  const { row, width, focused, selectedStoryId, expandedFamilies, ctx } = options;
  if (row.kind === 'family') {
    const family = STORY_FAMILIES.find((candidate) => candidate.id === row.familyId);
    if (family == null) return line('', width);
    const expanded = expandedFamilies[row.familyId] ?? false;
    const focusPrefix = focused
      ? ctx.style.styled(ctx.semantic('accent'), '›')
      : ' ';
    const arrow = ctx.style.styled(ctx.semantic('accent'), expanded ? '▼' : '▶');
    const title = focused
      ? ctx.style.styled(ctx.semantic('primary'), family.label)
      : family.label;
    return line(`${focusPrefix} ${arrow} ${title}`, width);
  }

  const story = row.storyId == null ? undefined : findComponentStory(row.storyId);
  if (story == null) return line('', width);
  const selected = selectedStoryId === story.id;
  const focusPrefix = focused
    ? ctx.style.styled(ctx.semantic('accent'), '›')
    : ' ';
  const bullet = selected
    ? ctx.style.styled(ctx.semantic('accent'), '•')
    : ctx.style.styled(ctx.border('muted'), '•');
  const title = selected
    ? ctx.style.styled(ctx.semantic('accent'), story.title)
    : story.title;
  return line(`${focusPrefix}   ${bullet} ${title}`, width);
}
