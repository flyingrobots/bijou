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
  warningText,
} from './story-preview-style.js';

export function confirmPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly question: string;
  readonly defaultValue?: boolean;
  readonly yesMeaning: string;
  readonly noMeaning: string;
}): string | Surface {
  const {
    width,
    ctx,
    question,
    defaultValue = true,
    yesMeaning,
    noMeaning,
  } = input;
  const yesLabel = dogfoodText(undefined, 'stories.preview.confirm.yesLabel', 'Yes');
  const noLabel = dogfoodText(undefined, 'stories.preview.confirm.noLabel', 'No');
  const hint = defaultValue
    ? dogfoodText(undefined, 'stories.preview.confirm.defaultYesHint', '[Y/n]')
    : dogfoodText(undefined, 'stories.preview.confirm.defaultNoHint', '[y/N]');
  const defaultLabel = defaultValue ? yesLabel : noLabel;

  if (ctx.mode === 'pipe') {
    return [
      dogfoodText(undefined, 'stories.preview.confirm.pipeQuestion', '{question} {hint}?', {
        question,
        hint: defaultValue ? 'Y/n' : 'y/N',
      }),
      dogfoodText(undefined, 'stories.preview.confirm.yesMeaning', 'Yes: {meaning}', { meaning: yesMeaning }),
      dogfoodText(undefined, 'stories.preview.confirm.noMeaning', 'No: {meaning}', { meaning: noMeaning }),
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      question,
      dogfoodText(undefined, 'stories.preview.confirm.accessibleDefault', 'Type yes or no (default: {value}).', {
        value: defaultValue
          ? dogfoodText(undefined, 'stories.preview.confirm.yesValue', 'yes')
          : dogfoodText(undefined, 'stories.preview.confirm.noValue', 'no'),
      }),
      dogfoodText(undefined, 'stories.preview.confirm.yesMeaning', 'Yes: {meaning}', { meaning: yesMeaning }),
      dogfoodText(undefined, 'stories.preview.confirm.noMeaning', 'No: {meaning}', { meaning: noMeaning }),
    ].join('\n');
  }

  const panelWidth = Math.max(38, Math.min(width, 54));
  return boxSurface(contentSurface([
    `${infoText(ctx, '?')} ${question} ${mutedText(ctx, hint)}`,
    '',
    dogfoodText(undefined, 'stories.preview.confirm.defaultLine', 'Default: {value}', {
      value: defaultValue ? successText(ctx, defaultLabel) : warningText(ctx, defaultLabel),
    }),
    dogfoodText(undefined, 'stories.preview.confirm.yesMeaning', 'Yes: {meaning}', { meaning: yesMeaning }),
    dogfoodText(undefined, 'stories.preview.confirm.noMeaning', 'No: {meaning}', { meaning: noMeaning }),
    '',
    mutedText(ctx, dogfoodText(undefined, 'stories.preview.confirm.enterDefault', 'Enter accepts the default.')),
  ].join('\n')), {
    title: dogfoodText(undefined, 'stories.preview.confirm.title', 'binary decision'),
    width: panelWidth,
    ctx,
  });
}
