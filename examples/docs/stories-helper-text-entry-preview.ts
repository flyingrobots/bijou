import { boxSurface, contentSurface, dogfoodText, infoText, mutedText } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function textEntryPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly label: string;
  readonly value: string;
  readonly helperText?: string;
  readonly validationText?: string;
  readonly multiline?: boolean;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    label,
    value,
    helperText,
    validationText,
    multiline = false,
  } = input;

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      `${label}:`,
      value,
      ...(helperText ? ['', dogfoodText(undefined, 'stories.preview.textEntry.help', 'Help: {value}', { value: helperText })] : []),
      ...(validationText ? [dogfoodText(undefined, 'stories.preview.textEntry.validation', 'Validation: {value}', { value: validationText })] : []),
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      '',
      dogfoodText(undefined, 'stories.preview.textEntry.field', 'Field: {label}', { label }),
      dogfoodText(undefined, 'stories.preview.textEntry.inputType', 'Input type: {value}', {
        value: multiline
          ? dogfoodText(undefined, 'stories.preview.textEntry.multilineType', 'multiline text')
          : dogfoodText(undefined, 'stories.preview.textEntry.singleLineType', 'single-line text'),
      }),
      dogfoodText(undefined, 'stories.preview.textEntry.currentValue', 'Current value: {value}', {
        value: value.replace(/\n/g, ' / '),
      }),
      ...(helperText ? [dogfoodText(undefined, 'stories.preview.textEntry.help', 'Help: {value}', { value: helperText })] : []),
      ...(validationText ? [dogfoodText(undefined, 'stories.preview.textEntry.validation', 'Validation: {value}', { value: validationText })] : []),
    ].join('\n');
  }

  return boxSurface(contentSurface([
    `${infoText(ctx, '?')} ${title}`,
    '',
    mutedText(ctx, label),
    value,
    ...(helperText ? ['', mutedText(ctx, helperText)] : []),
    ...(validationText ? [mutedText(ctx, validationText)] : []),
  ].join('\n')), {
    title: multiline
      ? dogfoodText(undefined, 'stories.preview.textEntry.multilineTitle', 'multiline entry')
      : dogfoodText(undefined, 'stories.preview.textEntry.title', 'text entry'),
    width: Math.max(42, Math.min(width, multiline ? 62 : 54)),
    ctx,
  });
}
