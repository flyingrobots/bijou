import {
  createSurface,
  parseAnsiToSurface,
  stringToSurface,
  type BijouContext,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';
import type { App, FrameLayoutNode, OverflowX, ViewOutput } from '@flyingrobots/bijou-tui';

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

export function legacyApp<Model, Msg>(
  ctx: BijouContext,
  app: Omit<App<Model, Msg>, 'view'> & { view(model: Model): string | ViewOutput },
): App<Model, Msg> {
  return {
    ...app,
    view(model: Model): ViewOutput {
      const output = app.view(model) as string | Surface | LayoutNode;
      if (typeof output === 'string') {
        return textSurface(output, ctx.runtime.columns, ctx.runtime.rows);
      }
      return output;
    },
  };
}

export function legacyPane(
  paneId: string,
  render: (width: number, height: number) => string,
  options: { overflowX?: OverflowX } = {},
): FrameLayoutNode {
  return {
    kind: 'pane',
    paneId,
    overflowX: options.overflowX,
    render(width: number, height: number): ViewOutput {
      return textSurface(render(width, height), width, height);
    },
  };
}

function visibleWidth(text: string): number {
  return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}
