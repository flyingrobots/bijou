import type { Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import type { HeaderBoxOptions } from './box.js';
import { createSegmentSurface, tokenToCellStyle } from './surface-text.js';
import { boxSurface } from './box-v3.part02.js';

/**
 * Render a header box as a Surface for V3-native composition.
 *
 * Unlike {@link headerBox}, this always returns a Surface and is intended
 * for use inside framed apps or other surface-first render paths.
 */
export function headerBoxSurface(label: string, options: HeaderBoxOptions = {}): Surface {
  const ctx = resolveCtx(options.ctx);
  const safeLabel = sanitizePlainTerminalText(label);
  const detail = sanitizePlainTerminalText(options.detail ?? '');
  const labelToken = options.labelToken ?? ctx?.semantic('primary');
  const mutedToken = ctx?.semantic('muted');

  const segments = [];
  if (safeLabel.length > 0) {
    segments.push({ text: safeLabel, style: tokenToCellStyle(labelToken) });
  }
  if (detail.length > 0) {
    segments.push({
      text: safeLabel.length > 0 ? `  ${detail}` : detail,
      style: tokenToCellStyle(mutedToken),
    });
  }

  return boxSurface(createSegmentSurface(segments), options);
}
