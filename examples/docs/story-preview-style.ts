import type { BijouContext } from '@flyingrobots/bijou';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';

export type StoryPreviewLocalization = LocalizationPort | undefined;

const STORY_PREVIEW_TOKENS = {
  info: { id: 'info' },
  muted: { id: 'muted' },
  success: { id: 'success' },
  warning: { id: 'warning' },
} as const;

export function dogfoodText(
  localization: StoryPreviewLocalization,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function infoText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.semantic(STORY_PREVIEW_TOKENS.info.id), text);
}

export function mutedText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.semantic(STORY_PREVIEW_TOKENS.muted.id), text);
}

export function successText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.status(STORY_PREVIEW_TOKENS.success.id), text);
}

export function warningText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.status(STORY_PREVIEW_TOKENS.warning.id), text);
}
