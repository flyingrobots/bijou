import type { Surface } from '../../ports/surface.js';
import { createSurface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { type AlertOptions, type AlertVariant } from './alert.js';
import { boxSurface } from './box-v3.js';
import { createTextSurface, tokenToCellStyle } from './surface-text.js';

const ICONS: Record<AlertVariant, string> = {
  success: '\u2713',  // ✓
  error: '\u2717',    // ✗
  warning: '\u26A0',  // ⚠
  info: '\u2139',     // ℹ
};

const BORDER_TOKENS: Record<AlertVariant, 'success' | 'error' | 'warning' | 'primary'> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'primary',
};

/**
 * Render an alert box as a Surface for V3-native composition.
 */
export function alertSurface(message: string | Surface, options: AlertOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const variant = options.variant ?? 'info';
  const iconSurface = createTextSurface(ICONS[variant], tokenToCellStyle(ctx?.semantic(variant)));
  const messageSurface = typeof message === 'string' ? createTextSurface(message) : message;
  const width = iconSurface.width + 1 + messageSurface.width;
  const height = Math.max(iconSurface.height, messageSurface.height, 1);
  const content = createSurface(width, height, { char: ' ', empty: false });

  content.blit(iconSurface, 0, 0);
  content.set(iconSurface.width, 0, { char: ' ', empty: false });
  content.blit(messageSurface, iconSurface.width + 1, 0);

  return boxSurface(content, {
    ...options,
    borderToken: options.borderToken ?? ctx?.border(BORDER_TOKENS[variant]),
    bgToken: options.bgToken ?? ctx?.surface('elevated'),
  });
}
