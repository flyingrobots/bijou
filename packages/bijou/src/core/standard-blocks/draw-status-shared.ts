import type { BijouContext } from '../../ports/context.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import type { AlertVariant } from '../components/alert.js';
import type { BadgeVariant } from '../components/badge.js';
import { parseAnsiToSurface } from '../render/differ-ansi.js';
import { resolveSafeCtx } from '../resolve-ctx.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { slotValueText } from './render.part03.js';

/** Separator between joined facts on one drawn row. */
const FACT_SEPARATOR = ' · ';

/** One row of untrusted slot text: control bytes removed, then clipped or padded to `width`. */
function textRow(text: string, width: number): Surface {
  return parseAnsiToSurface(sanitizePlainTerminalText(text), Math.max(0, width), 1);
}

/**
 * One row of a string Component's output (which may carry its own styling),
 * clipped or padded to `width`. Callers sanitize any slot text they put in it.
 */
function componentRow(text: string, width: number): Surface {
  return parseAnsiToSurface(text, Math.max(0, width), 1);
}

/** Stacks one-row Surfaces into a block `width` wide. */
function stackRows(rows: readonly Surface[], width: number): Surface {
  const height = rows.reduce((sum, row) => sum + row.height, 0);
  const stacked = createSurface(width, Math.max(1, height));
  let y = 0;
  for (const row of rows) {
    stacked.blit(row, 0, y);
    y += row.height;
  }
  return stacked;
}

/**
 * The default context, when there is one in a visual mode. String Components
 * (`kbd`, `progressBar`) need a context and lower themselves under `pipe`, so
 * a drawn block uses them only when this returns a context.
 */
function visualContext(): BijouContext | undefined {
  const ctx = resolveSafeCtx();
  return ctx !== undefined && (ctx.mode === 'interactive' || ctx.mode === 'static') ? ctx : undefined;
}

const STATUS_VARIANTS: ReadonlyMap<string, BadgeVariant> = new Map([
  ['ok', 'success'], ['ready', 'success'], ['success', 'success'], ['passed', 'success'],
  ['done', 'success'], ['complete', 'success'], ['synced', 'success'],
  ['warning', 'warning'], ['warn', 'warning'], ['stale', 'warning'], ['degraded', 'warning'],
  ['high', 'warning'], ['urgent', 'warning'],
  ['error', 'error'], ['failed', 'error'], ['failure', 'error'], ['blocked', 'error'], ['critical', 'error'],
  ['pending', 'pending'], ['queued', 'pending'],
  ['active', 'active'], ['running', 'active'],
  ['low', 'muted'], ['muted', 'muted'], ['idle', 'muted'],
]);

/** The badge variant for a status or priority word; `info` for any other text. */
function statusVariant(text: string): BadgeVariant {
  return STATUS_VARIANTS.get(text.trim().toLowerCase()) ?? 'info';
}

const ALERT_VARIANTS: readonly AlertVariant[] = ['info', 'warning', 'error', 'success'];

/** The alert variant named by `severity`; `info` for any other text. */
function alertVariant(severity: string | undefined): AlertVariant {
  const key = severity?.trim().toLowerCase();
  return ALERT_VARIANTS.find((variant) => variant === key) ?? 'info';
}

/** The non-blank items of a list slot; a single value counts as one item. */
function listItems(value: unknown): readonly string[] {
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) => slotValueText(item))
    .filter((item): item is string => item !== undefined && item.trim() !== '');
}

/** Whether optional slot text is present and not blank. */
function hasText(text: string | undefined): text is string {
  return text !== undefined && text.trim() !== '';
}

export {
  FACT_SEPARATOR,
  alertVariant,
  componentRow,
  hasText,
  listItems,
  stackRows,
  statusVariant,
  textRow,
  visualContext,
};
