import {
  badge,
  createSurface,
  parseAnsiToSurface,
  stringToSurface,
  stripAnsi,
  surfaceToString,
  type BadgeVariant,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import { hstackSurface, vstackSurface } from '@flyingrobots/bijou-tui';

export function line(text: string, width = visibleWidth(text)): Surface {
  return parseAnsiToSurface(text, Math.max(1, width), 1);
}

export function spacer(width = 1, height = 1): Surface {
  return createSurface(width, height);
}

export function centerSurface(ctx: BijouContext, content: Surface, topOffset = 0): Surface {
  const width = Math.max(1, ctx.runtime.columns);
  const height = Math.max(1, ctx.runtime.rows);
  const full = createSurface(width, height);
  const x = Math.max(0, Math.floor((full.width - content.width) / 2));
  const y = Math.max(0, Math.floor((full.height - content.height) / 2) + topOffset);
  full.blit(content, x, y);
  return full;
}

export function screenSurface(width: number, height: number, content: Surface, row = 0, col = 0): Surface {
  const full = createSurface(Math.max(1, width), Math.max(1, height));
  full.blit(content, col, row);
  return full;
}

export function textSurface(text: string, width: number, height: number): Surface {
  return stringToSurface(text, Math.max(1, width), Math.max(1, height));
}

export function ansiSurface(text: string, width: number, height: number): Surface {
  return parseAnsiToSurface(text, Math.max(1, width), Math.max(1, height));
}

export function contentSurface(text: string): Surface {
  const lines = text.split(/\r?\n/);
  const width = Math.max(1, ...lines.map((line) => stripAnsi(line).length));
  const height = Math.max(1, lines.length);
  return parseAnsiToSurface(text, width, height);
}

export function badgeSurface(label: string, variant: BadgeVariant, ctx: BijouContext): Surface {
  return badge(label, { variant, ctx });
}

export function row(parts: readonly (string | Surface)[]): Surface {
  return hstackSurface(0, ...parts.map((part) => typeof part === 'string' ? line(part) : part));
}

export function column(rows: readonly (string | Surface)[]): Surface {
  return vstackSurface(...rows.map((entry) => typeof entry === 'string' ? contentSurface(entry) : entry));
}

export function renderSurface(surface: Surface, ctx: BijouContext): string {
  return surfaceToString(surface, ctx.style);
}

function visibleWidth(text: string): number {
  return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}
