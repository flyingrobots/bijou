import {
  createSurface,
  paintLayoutNode,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';

export type ViewOutput = Surface | LayoutNode;

export interface ViewportSize {
  width: number;
  height: number;
}

export interface NormalizedViewOutput {
  kind: 'surface' | 'layout';
  surface: Surface;
}

export function isSurfaceView(value: unknown): value is Surface {
  return typeof value === 'object' && value !== null && 'cells' in value;
}

export function isLayoutNodeView(value: unknown): value is LayoutNode {
  return typeof value === 'object' && value !== null && 'rect' in value && 'children' in value;
}

export function normalizeViewOutput(
  output: ViewOutput,
  size: ViewportSize,
): NormalizedViewOutput {
  if (isSurfaceView(output)) {
    return {
      kind: 'surface',
      surface: output,
    };
  }

  if (!isLayoutNodeView(output)) {
    throw new Error(
      'Bijou runtime views must return a Surface or LayoutNode. Raw strings are no longer supported; convert them explicitly with parseAnsiToSurface(...) or stringToSurface(...).',
    );
  }

  return {
    kind: 'layout',
    surface: paintViewLayout(output, size),
  };
}

export function wrapViewOutputAsLayoutRoot(
  output: ViewOutput,
  _size: ViewportSize,
): LayoutNode {
  if (isSurfaceView(output)) {
    return {
      type: 'SurfaceView',
      rect: { x: 0, y: 0, width: output.width, height: output.height },
      children: [],
      surface: output,
    };
  }

  if (!isLayoutNodeView(output)) {
    throw new Error(
      'Bijou runtime views must return a Surface or LayoutNode. Raw strings are no longer supported; convert them explicitly with parseAnsiToSurface(...) or stringToSurface(...).',
    );
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
