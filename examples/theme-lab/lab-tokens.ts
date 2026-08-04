import type { BijouContext, Theme, TokenValue } from '@flyingrobots/bijou';

/** One flattened, addressable colour token from a theme. */
export interface LabToken {
  /** Token group, e.g. `semantic`. */
  readonly group: LabTokenGroup;
  /** Dotted token path, e.g. `semantic.accent`. */
  readonly path: string;
  /** Resolved token value. */
  readonly token: TokenValue;
}

/** Token groups rendered by the lab, in display order. */
export const LAB_TOKEN_GROUPS = ['surface', 'semantic', 'status', 'border', 'ui'] as const;

/** One of the colour-bearing groups the lab knows how to read. */
export type LabTokenGroup = (typeof LAB_TOKEN_GROUPS)[number];

/**
 * Read one colour group off a theme.
 *
 * Switched rather than index-signature-cast so the compiler still checks
 * that every group named in {@link LAB_TOKEN_GROUPS} actually exists on
 * `Theme`. A cast here would let a renamed token group fail silently at
 * runtime instead of at build time.
 */
function groupRecord(theme: Theme, group: LabTokenGroup): Record<string, TokenValue> {
  switch (group) {
    case 'surface': return theme.surface;
    case 'semantic': return theme.semantic;
    case 'status': return theme.status;
    case 'border': return theme.border;
    case 'ui': return theme.ui;
  }
}

/** Flatten every colour token in a theme into an ordered, addressable list. */
export function collectLabTokens(theme: Theme): readonly LabToken[] {
  return LAB_TOKEN_GROUPS.flatMap((group) =>
    Object.entries(groupRecord(theme, group)).map(([key, token]) => ({
      group,
      path: `${group}.${key}`,
      token,
    })),
  );
}

/** Longest token path in a list, used to align swatch columns. */
export function widestPath(tokens: readonly LabToken[]): number {
  return tokens.reduce((max, entry) => Math.max(max, entry.path.length), 0);
}

/**
 * Render a solid colour chip.
 *
 * Uses a background fill rather than a glyph so the swatch shows the colour
 * itself, not the colour filtered through a font's stroke weight.
 */
export function chip(ctx: BijouContext, hex: string, width = 6): string {
  return ctx.style.bgHex(hex, ' '.repeat(Math.max(1, width)));
}

/**
 * Render one token as a swatch row: a colour chip, the token path, and the
 * hex. Tokens carrying a background render an `Aa` sample in the actual
 * foreground/background pair instead of a flat chip.
 *
 * The row degrades rather than overflows. A pane too narrow for the full
 * `fg/bg` detail drops to the background hex alone, and one too narrow for
 * that drops the hex entirely — the chip and the path always survive, since
 * those are what make the row addressable.
 */
export function swatchRow(
  ctx: BijouContext,
  entry: LabToken,
  pathWidth: number,
  width = Number.POSITIVE_INFINITY,
): string {
  const { hex, bg } = entry.token;
  const label = dim(ctx, entry.path.padEnd(pathWidth));

  if (bg === undefined) {
    const head = `${chip(ctx, hex)} ${label}`;
    return width >= 6 + 1 + pathWidth + 1 + hex.length ? `${head} ${dim(ctx, hex)}` : head;
  }

  const sample = ctx.style.bgHex(bg, ctx.style.hex(hex, ' Aa '));
  const head = `${chip(ctx, bg, 2)}${sample} ${label}`;
  const used = 2 + 4 + 1 + pathWidth + 1;
  if (width >= used + hex.length + 1 + bg.length) return `${head} ${dim(ctx, `${hex}/${bg}`)}`;
  if (width >= used + bg.length) return `${head} ${dim(ctx, bg)}`;
  return head;
}

function dim(ctx: BijouContext, text: string): string {
  return ctx.style.styled(ctx.semantic('muted'), text);
}
