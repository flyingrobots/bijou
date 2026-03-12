import {
  createSurface,
  paintLayoutNode,
  parseAnsiToSurface,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';

export type ViewOutput = Surface | LayoutNode | string;

export interface ViewportSize {
  width: number;
  height: number;
}

export interface NormalizedViewOutput {
  kind: 'surface' | 'layout' | 'string';
  legacyString: boolean;
  surface: Surface;
}

export function isSurfaceView(value: unknown): value is Surface {
  return typeof value === 'object' && value !== null && 'cells' in value;
}

export function normalizeViewOutput(
  output: ViewOutput,
  size: ViewportSize,
): NormalizedViewOutput {
  if (typeof output === 'string') {
    return {
      kind: 'string',
      legacyString: true,
      surface: parseAnsiToSurface(output, size.width, size.height),
    };
  }

  if (isSurfaceView(output)) {
    return {
      kind: 'surface',
      legacyString: false,
      surface: output,
    };
  }

  return {
    kind: 'layout',
    legacyString: false,
    surface: paintViewLayout(output, size),
  };
}

export function wrapViewOutputAsLayoutRoot(
  output: ViewOutput,
  size: ViewportSize,
): LayoutNode {
  if (typeof output === 'string') {
    return {
      type: 'LegacyTextView',
      classes: ['legacy-view'],
      rect: { x: 0, y: 0, width: size.width, height: size.height },
      children: [],
      surface: parseAnsiToSurface(output, size.width, size.height),
    };
  }

  if (isSurfaceView(output)) {
    return {
      type: 'SurfaceView',
      rect: { x: 0, y: 0, width: output.width, height: output.height },
      children: [],
      surface: output,
    };
  }

  return output;
}

function paintViewLayout(node: LayoutNode, size: ViewportSize): Surface {
  const width = Math.max(size.width, node.rect.x + node.rect.width, 0);
  const height = Math.max(size.height, node.rect.y + node.rect.height, 0);
  const surface = createSurface(width, height);
  paintLayoutNode(surface, node);
  return surface;
}
