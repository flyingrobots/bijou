import { boxSurface, column, contentSurface, line, mutedText, separatorSurface, spacer } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function stagedFormPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'group' | 'wizard';
  readonly stepLabel?: string;
  readonly fields: readonly { readonly label: string; readonly value: string }[];
  readonly summaryText: string;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
    stepLabel,
    fields,
    summaryText,
  } = input;

  if (ctx.mode === 'pipe') {
    return [
      title,
      ...(stepLabel ? ['', stepLabel] : []),
      '',
      ...fields.flatMap((field) => [`${field.label}:`, field.value, '']),
      `Summary: ${summaryText}`,
    ].join('\n').trimEnd();
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      ...(stepLabel ? [`Current step: ${stepLabel}`] : []),
      '',
      ...fields.map((field) => `${field.label}: ${field.value}`),
      '',
      `Summary: ${summaryText}`,
    ].join('\n');
  }

  const panelWidth = Math.max(46, Math.min(width, 64));
  const innerWidth = Math.max(24, panelWidth - 2);
  return boxSurface(column([
    ...(stepLabel ? [separatorSurface({ label: stepLabel, width: innerWidth, ctx }), spacer()] : []),
    ...fields.flatMap((field, index) => ([
      line(mutedText(ctx, field.label), innerWidth),
      contentSurface(field.value),
      ...(index < fields.length - 1 ? [spacer()] : []),
    ])),
    spacer(),
    line(mutedText(ctx, summaryText), innerWidth),
  ]), {
    title: mode === 'wizard' ? 'staged form' : 'form group',
    width: panelWidth,
    ctx,
  });
}
