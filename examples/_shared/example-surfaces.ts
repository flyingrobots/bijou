import {
  createSurface,
  parseAnsiToSurface,
  stringToSurface,
  stripAnsi,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';

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

function visibleWidth(text: string): number {
  return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}
