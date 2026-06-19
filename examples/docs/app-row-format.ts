import type { BijouContext, TokenValue } from '../../packages/bijou/src/index.js';

export interface AppRowDescriptor {
  readonly kind: 'family' | 'story';
  readonly familyId: string;
  readonly storyId?: string;
}

export interface AppRowFamily {
  readonly id: string;
  readonly label: string;
}

export interface AppRowStory {
  readonly id: string;
  readonly title: string;
}

interface AppRowTokens {
  readonly accent: TokenValue;
  readonly muted: TokenValue;
}

export function formatFamilyRow(options: {
  readonly row: AppRowDescriptor;
  readonly focused: boolean;
  readonly selectedStoryId?: string;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly ctx: BijouContext;
  readonly tokens: AppRowTokens;
  readonly findFamily: (familyId: string) => AppRowFamily | undefined;
  readonly findStory: (storyId: string) => AppRowStory | undefined;
}): string {
  const { row, focused, selectedStoryId, expandedFamilies, ctx, tokens, findFamily, findStory } = options;
  if (row.kind === 'family') {
    const family = findFamily(row.familyId);
    if (family == null) return '';
    const expanded = expandedFamilies[row.familyId] ?? false;
    const focusPrefix = focused
      ? ctx.style.styled(tokens.accent, '›')
      : ' ';
    const arrow = ctx.style.styled(tokens.accent, expanded ? '▼' : '▶');
    const title = focused
      ? ctx.style.styled(tokens.accent, family.label)
      : family.label;
    return `${focusPrefix} ${arrow} ${title}`;
  }

  const story = row.storyId == null ? undefined : findStory(row.storyId);
  if (story == null) return '';
  const selected = selectedStoryId === story.id;
  const focusPrefix = focused
    ? ctx.style.styled(tokens.accent, '›')
    : ' ';
  const bullet = selected
    ? ctx.style.styled(tokens.accent, '•')
    : ctx.style.styled(tokens.muted, '•');
  const title = selected
    ? ctx.style.styled(tokens.accent, story.title)
    : story.title;
  return `${focusPrefix}   ${bullet} ${title}`;
}

export function formatGuideRow(options: {
  readonly item: { readonly label: string; readonly value: string; readonly description?: string };
  readonly focused: boolean;
  readonly selectedGuideId?: string;
  readonly ctx: BijouContext;
  readonly tokens: AppRowTokens;
}): string {
  const { item, focused, selectedGuideId, ctx, tokens } = options;
  const selected = selectedGuideId === item.value;
  const focusPrefix = focused
    ? ctx.style.styled(tokens.accent, '›')
    : ' ';
  const bullet = selected
    ? ctx.style.styled(tokens.accent, '•')
    : ctx.style.styled(tokens.muted, '•');
  const title = selected || focused
    ? ctx.style.styled(tokens.accent, item.label)
    : item.label;
  return `${focusPrefix} ${bullet} ${title}`;
}
