import {
  boxSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import { contentSurface } from '../_shared/example-surfaces.js';
import {
  dogfoodText,
  infoText,
  mutedText,
  successText,
} from './story-preview-style.js';

export interface MultiselectPreviewOption {
  readonly label: string;
  readonly description?: string;
}

export function multiselectPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly options: readonly MultiselectPreviewOption[];
  readonly selectedIndices: readonly number[];
  readonly focusedIndex?: number;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    options,
    selectedIndices,
    focusedIndex = 0,
  } = input;
  const selectedSet = new Set(selectedIndices);
  const selectedLabels = options
    .filter((_, index) => selectedSet.has(index))
    .map((option) => option.label);

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      ...options.map((option, index) => `${String(index + 1)}. ${option.label}`),
      '',
      dogfoodText(undefined, 'stories.preview.multiselect.enterNumbers', 'Enter numbers (comma-separated): {value}', {
        value: selectedIndices.map((index) => String(index + 1)).join(', '),
      }),
      dogfoodText(undefined, 'stories.preview.multiselect.selected', 'Selected: {value}', {
        value: selectedLabels.join(', '),
      }),
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    const selected = dogfoodText(undefined, 'stories.preview.choice.selected', 'selected');
    const notSelected = dogfoodText(undefined, 'stories.preview.choice.notSelected', 'not selected');
    return [
      title,
      '',
      ...options.map((option, index) => {
        const state = selectedSet.has(index) ? selected : notSelected;
        return `${String(index + 1)}. ${option.label} (${state})${option.description ? ` — ${option.description}` : ''}`;
      }),
      '',
      dogfoodText(undefined, 'stories.preview.multiselect.instructions', 'Enter numbers separated by commas to choose a set.'),
      dogfoodText(undefined, 'stories.preview.multiselect.currentSet', 'Current set: {value}', {
        value: selectedLabels.join(', '),
      }),
    ].join('\n');
  }

  const lines = [
    `${infoText(ctx, '?')} ${title}`,
    '',
    ...options.map((option, index) => {
      const pointer = index === focusedIndex ? infoText(ctx, '\u276f') : ' ';
      const mark = selectedSet.has(index) ? successText(ctx, '\u25c9') : mutedText(ctx, '\u25cb');
      const description = option.description ? mutedText(ctx, ` \u2014 ${option.description}`) : '';
      return `${pointer} ${mark} ${option.label}${description}`;
    }),
    '',
    mutedText(ctx, dogfoodText(undefined, 'stories.preview.multiselect.hint', '(space to toggle, enter to confirm)')),
  ];

  return boxSurface(contentSurface(lines.join('\n')), {
    title: dogfoodText(undefined, 'stories.preview.multiselect.title', 'multiple choice'),
    width: Math.max(40, Math.min(width, 58)),
    ctx,
  });
}
