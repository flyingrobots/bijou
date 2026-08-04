import {
  alert,
  box,
  kbd,
  progressBar,
  separator,
  stepper,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import {
  badgeSurface,
  column,
  contentSurface,
  row,
  screenSurface,
  spacer,
} from '../_shared/example-surfaces.js';

function heading(ctx: BijouContext, text: string): Surface {
  return contentSurface(ctx.style.styled(ctx.ui('sectionHeader'), text.toUpperCase()));
}

/**
 * Status-bearing components.
 *
 * These are the surfaces where a theme's semantic roles have to stay
 * distinguishable from each other. If `warning` and `accent` collapse to the
 * same colour, this panel is where it shows.
 */
export function feedbackPanel(ctx: BijouContext, width: number, height: number): Surface {
  const body = column([
    heading(ctx, 'badge'),
    row([
      badgeSurface('SUCCESS', 'success', ctx), ' ',
      badgeSurface('ERROR', 'error', ctx), ' ',
      badgeSurface('WARNING', 'warning', ctx), ' ',
      badgeSurface('INFO', 'info', ctx),
    ]),
    row([
      badgeSurface('ACCENT', 'accent', ctx), ' ',
      badgeSurface('PRIMARY', 'primary', ctx), ' ',
      badgeSurface('PENDING', 'pending', ctx), ' ',
      badgeSurface('MUTED', 'muted', ctx),
    ]),
    spacer(1, 1),
    heading(ctx, 'alert'),
    contentSurface(alert('Release 7.2.0 published.', { variant: 'success', ctx })),
    contentSurface(alert('Two advisories remain open.', { variant: 'warning', ctx })),
    contentSurface(alert('Build failed on node 22.', { variant: 'error', ctx })),
    contentSurface(alert('Cache warmed in 1.2s.', { variant: 'info', ctx })),
    spacer(1, 1),
    heading(ctx, 'progressBar'),
    contentSurface(progressBar(24, { width: 34, showPercent: true, ctx })),
    contentSurface(progressBar(61, { width: 34, showPercent: true, ctx })),
    contentSurface(progressBar(100, { width: 34, showPercent: true, ctx })),
    spacer(1, 1),
    heading(ctx, 'stepper'),
    contentSurface(stepper(
      [{ label: 'Shape' }, { label: 'Build' }, { label: 'Verify' }, { label: 'Ship' }],
      { current: 2, ctx },
    )),
  ]);

  return screenSurface(width, height, body);
}

/**
 * Structural components.
 *
 * These lean on border and surface tokens rather than status tokens, so they
 * expose whether a theme keeps enough separation between chrome and content.
 */
export function structurePanel(ctx: BijouContext, width: number, height: number): Surface {
  const inner = Math.max(20, Math.min(width - 2, 46));
  const body = column([
    heading(ctx, 'box'),
    contentSurface(box('Surfaces stay legible when border and\nbackground tokens disagree enough.', { ctx })),
    spacer(1, 1),
    heading(ctx, 'separator'),
    contentSurface(separator({ label: 'tokens', width: inner, ctx })),
    spacer(1, 1),
    heading(ctx, 'kbd'),
    contentSurface(
      `${kbd('f2', { ctx })} settings   ${kbd('tab', { ctx })} next pane   ${kbd('q', { ctx })} quit`,
    ),
    spacer(1, 1),
    heading(ctx, 'gradient'),
    contentSurface(gradientStrip(ctx, inner)),
  ]);

  return screenSurface(width, height, body);
}

/**
 * Render the theme's brand gradient as a solid strip.
 *
 * Gradients are where a palette's mid-tones show themselves; an sRGB
 * interpolation between two saturated stops tends to sag through grey in the
 * middle, and that sag is visible here before it is visible anywhere else.
 */
function gradientStrip(ctx: BijouContext, width: number): string {
  const stops = ctx.gradient('brand');
  if (stops.length === 0) return '';

  const cells: string[] = [];
  for (let i = 0; i < width; i++) {
    const pos = width === 1 ? 0 : i / (width - 1);
    cells.push(ctx.style.bgRgb(...sampleGradient(stops, pos), ' '));
  }
  return cells.join('');
}

function sampleGradient(
  stops: ReturnType<BijouContext['gradient']>,
  pos: number,
): [number, number, number] {
  const first = stops[0];
  if (first === undefined) return [0, 0, 0];

  let lower = first;
  let upper = stops[stops.length - 1] ?? first;
  for (const stop of stops) {
    if (stop.pos <= pos) lower = stop;
    if (stop.pos >= pos) { upper = stop; break; }
  }

  const span = upper.pos - lower.pos;
  const t = span === 0 ? 0 : (pos - lower.pos) / span;
  const channel = (i: number): number => {
    const from = lower.color[i] ?? 0;
    const to = upper.color[i] ?? 0;
    return Math.round(from + (to - from) * t);
  };
  return [channel(0), channel(1), channel(2)];
}
