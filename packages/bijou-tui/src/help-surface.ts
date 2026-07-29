import {
  createSurface,
  parseAnsiToSurface,
  sanitizePositiveInt,
  type Surface,
} from '@flyingrobots/bijou';
import { helpFor, helpShort, helpView } from './help-text.js';
import type { BindingSource, HelpSurfaceOptions } from './help-types.js';
import { visibleLength } from './viewport.js';

/**
 * Render grouped help into a structured terminal surface.
 */
export function helpViewSurface(
  keymap: BindingSource,
  options?: HelpSurfaceOptions,
): Surface {
  return renderHelpSurface(helpView(keymap, options), options);
}

/**
 * Render a single-line help summary into a structured terminal surface.
 */
export function helpShortSurface(
  keymap: BindingSource,
  options?: Pick<HelpSurfaceOptions, 'enabledOnly' | 'groupFilter' | 'width'>,
): Surface {
  return renderHelpSurface(helpShort(keymap, options), options);
}

/**
 * Render one group-prefix selection into a structured terminal surface.
 */
export function helpForSurface(
  keymap: BindingSource,
  groupPrefix: string,
  options?: HelpSurfaceOptions,
): Surface {
  return renderHelpSurface(helpFor(keymap, groupPrefix, options), options);
}

function renderHelpSurface(
  text: string,
  options?: Pick<HelpSurfaceOptions, 'width' | 'height'>,
): Surface {
  const lines = text.length === 0 ? [''] : text.split('\n');
  const contentWidth = Math.max(1, ...lines.map((line) => visibleLength(line)));
  const width = Math.max(contentWidth, sanitizePositiveInt(options?.width, 1));
  const height = sanitizePositiveInt(options?.height, lines.length);
  return text.length === 0
    ? createSurface(width, height)
    : parseAnsiToSurface(text, width, height);
}
