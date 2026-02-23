import boxen, { type Options as BoxenOptions } from 'boxen';
import { detectOutputMode } from '../detect/tty.js';
import { styled } from '../theme/chalk-adapter.js';
import { getTheme } from '../theme/resolve.js';
import type { TokenValue } from '../theme/tokens.js';

export interface BoxOptions {
  /** Border color token. Uses theme.border.primary if not specified. */
  borderToken?: TokenValue;
  /** boxen border style. Default: 'single'. */
  borderStyle?: BoxenOptions['borderStyle'];
  /** boxen padding. Default: { top: 0, bottom: 0, left: 1, right: 1 }. */
  padding?: BoxenOptions['padding'];
}

/**
 * Renders content inside a themed box.
 *
 * Degrades by output mode:
 * - interactive/static: Boxen with themed border
 * - pipe: Content only (no border)
 * - accessible: Content with header prefix
 */
export function box(content: string, options: BoxOptions = {}): string {
  const mode = detectOutputMode();

  if (mode === 'pipe' || mode === 'accessible') {
    return content;
  }

  const t = getTheme();
  const borderToken = options.borderToken ?? t.theme.border.primary;

  return boxen(content, {
    padding: options.padding ?? { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: options.borderStyle ?? 'single',
    borderColor: t.hex(borderToken) as BoxenOptions['borderColor'],
  });
}

export interface HeaderBoxOptions extends BoxOptions {
  /** Detail text shown after the label (muted). */
  detail?: string;
  /** Label token override. Uses theme.semantic.primary if not specified. */
  labelToken?: TokenValue;
}

/**
 * Renders a header box with a styled label and optional detail text.
 *
 * Degrades by output mode:
 * - interactive/static: Boxen with styled label + muted detail
 * - pipe: "label  detail"
 * - accessible: "label: detail"
 */
export function headerBox(label: string, options: HeaderBoxOptions = {}): string {
  const mode = detectOutputMode();
  const detail = options.detail ?? '';

  if (mode === 'pipe') {
    return detail ? `${label}  ${detail}` : label;
  }
  if (mode === 'accessible') {
    return detail ? `${label}: ${detail}` : label;
  }

  const t = getTheme();
  const labelToken = options.labelToken ?? t.theme.semantic.primary;
  const content = detail
    ? styled(labelToken, label) + styled(t.theme.semantic.muted, `  ${detail}`)
    : styled(labelToken, label);

  return box(content, options);
}
