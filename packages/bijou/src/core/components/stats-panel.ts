/**
 * Stats panel — labeled box with aligned key-value rows.
 *
 * Renders a titled bordered panel with left-aligned labels and
 * right-aligned values. Each row can optionally include an inline
 * sparkline after the value.
 *
 * @example
 * ```ts
 * const panel = statsPanelSurface([
 *   { label: 'FPS', value: '30' },
 *   { label: 'frame', value: '148', sparkline: fpsHistory },
 *   { label: 'heap', value: '42.1 MB' },
 * ], { title: 'Perf', width: 30, ctx });
 * ```
 */

import { boxSurface } from './box-v3.js';
import { sparkline } from './sparkline.js';
import { tokenToCellStyle, createSegmentSurface, type SurfaceTextSegment } from './surface-text.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import type { BijouNodeOptions } from './types.js';
import type { TokenValue } from '../theme/tokens.js';

export interface StatsPanelEntry {
  /** Left-aligned label. */
  readonly label: string;
  /** Right-aligned value. */
  readonly value: string;
  /** Optional time-series data rendered as an inline sparkline after the value. */
  readonly sparkline?: readonly number[];
  /** Optional label color override. */
  readonly labelToken?: TokenValue;
  /** Optional value color override. */
  readonly valueToken?: TokenValue;
}

export interface StatsPanelOptions extends BijouNodeOptions {
  /** Panel title shown in the top border. */
  readonly title?: string;
  /** Total width of the panel including borders. Required. */
  readonly width: number;
  /** Border color token. */
  readonly borderToken?: TokenValue;
  /** Background color token. */
  readonly bgToken?: TokenValue;
  /** Token applied to labels by default. */
  readonly labelToken?: TokenValue;
  /** Token applied to values by default. */
  readonly valueToken?: TokenValue;
}

/**
 * Render a stats panel as a bordered box with aligned key-value rows.
 */
export function statsPanelSurface(
  entries: readonly StatsPanelEntry[],
  options: StatsPanelOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(4, options.width);
  // Inner width = total - 2 borders - 2 padding chars.
  const innerWidth = width - 4;

  if (entries.length === 0 || innerWidth <= 0) {
    return boxSurface('', { width, title: options.title, borderToken: options.borderToken, bgToken: options.bgToken, ctx });
  }

  // Compute column widths.
  const maxLabelLen = Math.max(...entries.map((e) => e.label.length));
  const gap = 1;

  // Build each row as a surface with styled segments.
  const rowSurfaces: Surface[] = [];
  for (const entry of entries) {
    const labelTok = entry.labelToken ?? options.labelToken;
    const valueTok = entry.valueToken ?? options.valueToken;
    const labelStyle = tokenToCellStyle(labelTok);
    const valueStyle = tokenToCellStyle(valueTok);

    const paddedLabel = entry.label.padEnd(maxLabelLen);
    const segments: SurfaceTextSegment[] = [
      { text: paddedLabel, style: labelStyle },
      { text: ' '.repeat(gap), style: {} },
    ];

    // Value + optional sparkline (only if it fits within the inner width).
    const sparkData = entry.sparkline;
    const sparkFits = sparkData && sparkData.length > 0
      && innerWidth - maxLabelLen - gap - entry.value.length - 1 > 0;
    if (sparkFits) {
      const sparkWidth = innerWidth - maxLabelLen - gap - entry.value.length - 1;
      const sparkStr = sparkline(sparkData, { width: sparkWidth });
      segments.push({ text: entry.value, style: valueStyle });
      segments.push({ text: ' ', style: {} });
      segments.push({ text: sparkStr, style: valueStyle });
    } else {
      segments.push({ text: entry.value, style: valueStyle });
    }

    rowSurfaces.push(createSegmentSurface(segments));
  }

  // Compose rows into a single content surface.
  const contentHeight = rowSurfaces.length;
  const contentWidth = innerWidth;
  const content = createSurface(contentWidth, contentHeight);
  for (let i = 0; i < rowSurfaces.length; i++) {
    content.blit(rowSurfaces[i]!, 0, i);
  }

  return boxSurface(content, {
    width,
    title: options.title,
    borderToken: options.borderToken,
    bgToken: options.bgToken,
    ctx,
  });
}
