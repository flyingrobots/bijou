import type { BijouContext, Surface, Theme } from '@flyingrobots/bijou';
import { ansiSurface } from '../_shared/example-surfaces.js';
import {
  collectLabTokens,
  swatchRow,
  widestPath,
  type LabToken,
} from './lab-tokens.js';

function heading(ctx: BijouContext, text: string): string {
  return ctx.style.styled(ctx.ui('sectionHeader'), text.toUpperCase());
}

function groupBlock(
  ctx: BijouContext,
  tokens: readonly LabToken[],
  group: string,
  pathWidth: number,
  width: number,
): readonly string[] {
  const rows = tokens.filter((entry) => entry.group === group);
  if (rows.length === 0) return [];
  return [
    heading(ctx, group),
    ...rows.map((entry) => swatchRow(ctx, entry, pathWidth, width)),
    '',
  ];
}

/**
 * Render the named token groups as aligned swatch rows.
 *
 * Every value shown here is read back out of the live theme, so the panel
 * tells the truth about whatever preset is currently applied rather than
 * repeating a copy of it.
 */
export function swatchPanel(
  ctx: BijouContext,
  theme: Theme,
  groups: readonly string[],
  width: number,
  height: number,
): Surface {
  const tokens = collectLabTokens(theme).filter((entry) => groups.includes(entry.group));
  const pathWidth = widestPath(tokens);
  const lines = groups.flatMap((group) => groupBlock(ctx, tokens, group, pathWidth, width));
  return ansiSurface(lines.join('\n'), width, height);
}

/**
 * Summary of how many distinct colours the active theme actually holds.
 *
 * A theme with far fewer distinct values than tokens is doing a lot of
 * aliasing — which is the shape a hand-authored palette takes, and the
 * number the colour campaign is trying to move.
 *
 * Returned as plain text: the frame sanitizes the help line, so pre-styled
 * ANSI would be stripped of its escape prefix and rendered as literal noise.
 */
export function derivationSummary(theme: Theme): string {
  const tokens = collectLabTokens(theme);
  const distinct = new Set(tokens.map((entry) => entry.token.hex.toLowerCase()));
  return `${String(distinct.size)} colours / ${String(tokens.length)} tokens`;
}
