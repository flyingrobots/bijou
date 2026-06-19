import {
  box,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import {
  dogfoodText,
  infoText,
  mutedText,
  successText,
} from './story-preview-style.js';

export interface SingleChoicePreviewOption {
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
}

export function selectPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly options: readonly SingleChoicePreviewOption[];
  readonly selectedIndex: number;
  readonly focusedIndex?: number;
}): string | Surface {
  const { width, ctx, title, options, selectedIndex, focusedIndex = selectedIndex } = input;
  const selected = options[selectedIndex] ?? options[0];

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      ...options.map((option, index) => `${String(index + 1)}. ${option.label}`),
      '',
      `> ${String(selectedIndex + 1)}`,
      dogfoodText(undefined, 'stories.preview.select.selected', 'Selected: {value}', { value: selected?.label ?? '' }),
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    const selectedLabel = dogfoodText(undefined, 'stories.preview.choice.selected', 'selected');
    const notSelected = dogfoodText(undefined, 'stories.preview.choice.notSelected', 'not selected');
    return [
      title,
      '',
      ...options.map((option, index) => {
        const state = index === selectedIndex ? selectedLabel : notSelected;
        return `${String(index + 1)}. ${option.label} (${state})${option.description ? ` — ${option.description}` : ''}`;
      }),
      '',
      dogfoodText(undefined, 'stories.preview.select.currentChoice', 'Current choice: {value}', {
        value: selected?.label ?? '',
      }),
      dogfoodText(undefined, 'stories.preview.select.instructions', 'Enter a number to choose one option.'),
    ].join('\n');
  }

  const lines = [
    `${infoText(ctx, '?')} ${title}`,
    '',
    ...options.map((option, index) => {
      const pointer = index === focusedIndex ? infoText(ctx, '\u276f') : ' ';
      const mark = index === selectedIndex ? successText(ctx, '\u25c9') : mutedText(ctx, '\u25cb');
      const description = option.description ? mutedText(ctx, ` \u2014 ${option.description}`) : '';
      return `${pointer} ${mark} ${option.label}${description}`;
    }),
    '',
    mutedText(ctx, dogfoodText(undefined, 'stories.preview.select.hint', '(↑/↓ browse, enter to confirm)')),
  ];

  return box(lines.join('\n'), {
    title: dogfoodText(undefined, 'stories.preview.select.title', 'single choice'),
    width: Math.max(42, Math.min(width, 60)),
    ctx,
  });
}

export function filterPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly query: string;
  readonly options: readonly SingleChoicePreviewOption[];
  readonly matchedIndices: readonly number[];
  readonly selectedIndex: number;
}): string | Surface {
  const { width, ctx, title, query, options, matchedIndices, selectedIndex } = input;
  const selected = options[selectedIndex] ?? options[0];
  const matchedOptions = matchedIndices.flatMap((sourceIndex) => {
    const option = options[sourceIndex];
    return option === undefined ? [] : [{ option, sourceIndex }];
  });

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      ...matchedOptions.map(({ option }, index) => `${String(index + 1)}. ${option.label}`),
      '',
      dogfoodText(undefined, 'stories.preview.filter.enterOrSearch', 'Enter number or search: {query}', { query }),
      dogfoodText(undefined, 'stories.preview.filter.matched', 'Matched: {value}', { value: selected?.label ?? '' }),
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    const selectedMatch = dogfoodText(undefined, 'stories.preview.filter.selectedMatch', 'selected match');
    const match = dogfoodText(undefined, 'stories.preview.filter.match', 'match');
    return [
      title,
      '',
      dogfoodText(undefined, 'stories.preview.filter.searchQuery', 'Search query: {query}', { query }),
      ...matchedOptions.map(({ option, sourceIndex }, index) => {
        const state = sourceIndex === selectedIndex ? selectedMatch : match;
        const keywords = option.keywords?.length
          ? dogfoodText(undefined, 'stories.preview.filter.keywords', ' — keywords: {value}', { value: option.keywords.join(', ') })
          : '';
        return `${String(index + 1)}. ${option.label} (${state})${option.description ? ` — ${option.description}` : ''}${keywords}`;
      }),
      '',
      dogfoodText(undefined, 'stories.preview.filter.currentMatch', 'Current match: {value}', { value: selected?.label ?? '' }),
      dogfoodText(undefined, 'stories.preview.filter.instructions', 'Type or enter a number to choose one option.'),
    ].join('\n');
  }

  const lines = [
    `${infoText(ctx, '?')} ${title}`,
    `${mutedText(ctx, dogfoodText(undefined, 'stories.preview.filter.searchLabel', 'Search:'))} ${query}`,
    '',
    ...matchedOptions.map(({ option, sourceIndex }) => {
      const pointer = sourceIndex === selectedIndex ? infoText(ctx, '\u276f') : ' ';
      const mark = sourceIndex === selectedIndex ? successText(ctx, '\u25c9') : mutedText(ctx, '\u25cb');
      const description = option.description ? mutedText(ctx, ` \u2014 ${option.description}`) : '';
      return `${pointer} ${mark} ${option.label}${description}`;
    }),
    '',
    mutedText(ctx, dogfoodText(undefined, 'stories.preview.filter.hint', '(type to narrow, enter to confirm)')),
  ];

  return box(lines.join('\n'), {
    title: dogfoodText(undefined, 'stories.preview.filter.title', 'filterable single choice'),
    width: Math.max(44, Math.min(width, 64)),
    ctx,
  });
}
