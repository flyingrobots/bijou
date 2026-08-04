import { themeContrastRatio, type BijouContext, type Surface, type Theme } from '@flyingrobots/bijou';
import { ansiSurface } from '../_shared/example-surfaces.js';
import { collectLabTokens, widestPath, type LabToken } from './lab-tokens.js';

const AA_BODY = 4.5;
const AA_LARGE = 3;

/**
 * Grade a measured ratio.
 *
 * An undefined ratio means the token's hex would not parse, which is a
 * different failure from "this pair is unreadable" and is reported as such
 * rather than being folded into FAIL.
 */
function verdict(ctx: BijouContext, ratio: number | undefined): string {
  if (ratio === undefined) return ctx.style.styled(ctx.semantic('muted'), '????');
  if (ratio >= AA_BODY) return ctx.style.styled(ctx.semantic('success'), 'AA  ');
  if (ratio >= AA_LARGE) return ctx.style.styled(ctx.semantic('warning'), 'lg  ');
  return ctx.style.styled(ctx.semantic('error'), 'FAIL');
}

function formatRatio(ratio: number | undefined): string {
  return (ratio === undefined ? '—' : ratio.toFixed(2)).padStart(6);
}

function heading(ctx: BijouContext, text: string): string {
  return ctx.style.styled(ctx.ui('sectionHeader'), text.toUpperCase());
}

function muted(ctx: BijouContext, text: string): string {
  return ctx.style.styled(ctx.semantic('muted'), text);
}

/**
 * Measure every foreground token against the theme's primary surface
 * background and report the WCAG 2.x ratio with a pass verdict.
 *
 * This is the panel that decides whether a palette is shippable. A colour
 * that looks right in a swatch grid can still be unreadable in place, and
 * only the measured pair says which.
 */
export function contrastPanel(
  ctx: BijouContext,
  theme: Theme,
  width: number,
  height: number,
): Surface {
  const background = theme.surface.primary.bg;
  if (background === undefined) {
    return ansiSurface(muted(ctx, 'Theme has no surface.primary background.'), width, height);
  }

  const tokens = collectLabTokens(theme)
    .filter((entry) => entry.group === 'semantic' || entry.group === 'status');
  const pathWidth = widestPath(tokens);

  const rows = tokens.map((entry) => {
    const ratio = themeContrastRatio(entry.token.hex, background);
    const swatch = ctx.style.bgHex(background, ctx.style.hex(entry.token.hex, ' Aa '));
    const path = muted(ctx, entry.path.padEnd(pathWidth));
    return `${verdict(ctx, ratio)} ${formatRatio(ratio)}  ${swatch} ${path}`;
  });

  const lines = [
    heading(ctx, `contrast vs surface.primary ${background}`),
    muted(ctx, `AA body ${String(AA_BODY)}:1  ·  AA large ${String(AA_LARGE)}:1`),
    '',
    ...rows,
    '',
    ...collisionBlock(ctx, theme),
  ];

  return ansiSurface(lines.join('\n'), width, height);
}

/**
 * Report token paths that resolve to the exact same colour.
 *
 * Aliasing is legitimate when it is deliberate — `semantic.success` pointing
 * at `status.success` is the system working. It is a defect when two roles
 * that must stay tellable apart land on one value, because no amount of
 * contrast checking will catch it.
 */
function collisionBlock(ctx: BijouContext, theme: Theme): readonly string[] {
  const byHex = new Map<string, LabToken[]>();
  for (const entry of collectLabTokens(theme)) {
    const key = entry.token.hex.toLowerCase();
    const bucket = byHex.get(key) ?? [];
    bucket.push(entry);
    byHex.set(key, bucket);
  }

  const collisions = [...byHex.entries()]
    .filter(([, entries]) => entries.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (collisions.length === 0) {
    return [heading(ctx, 'role collisions'), muted(ctx, 'None. Every token holds a distinct value.')];
  }

  return [
    heading(ctx, `role collisions (${String(collisions.length)})`),
    ...collisions.map(([hex, entries]) =>
      `${ctx.style.bgHex(hex, '   ')} ${muted(ctx, hex)}  ${entries.map((e) => e.path).join(', ')}`,
    ),
  ];
}
